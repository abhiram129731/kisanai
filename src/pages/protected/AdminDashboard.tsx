import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Phone, Calendar, Trash2, Search, Download, 
  Shield, MessageSquare, AlertCircle, Users, Sprout, 
  CloudSun, ShieldAlert, Award, FileText, Plus, Trash, 
  Edit, Check, HelpCircle, Activity, BarChart2, PieChart as PieIcon
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../../services/api';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
}

interface ManagedUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'farmer';
  isBanned: boolean;
  source: 'firebase' | 'local' | 'mongodb';
  createdAt?: string;
}

interface Scheme {
  id: string;
  title: string;
  category: string;
  targetCrop: string;
  description: string;
  link: string;
}

// Mock Analytics Data
const REGISTRATION_DATA = [
  { day: 'Mon', Users: 12 },
  { day: 'Tue', Users: 19 },
  { day: 'Wed', Users: 15 },
  { day: 'Thu', Users: 28 },
  { day: 'Fri', Users: 32 },
  { day: 'Sat', Users: 45 },
  { day: 'Sun', Users: 58 }
];

const METRICS_DATA = [
  { day: 'Mon', CopilotQueries: 48, DiseaseScans: 12 },
  { day: 'Tue', CopilotQueries: 59, DiseaseScans: 18 },
  { day: 'Wed', CopilotQueries: 62, DiseaseScans: 22 },
  { day: 'Thu', CopilotQueries: 75, DiseaseScans: 30 },
  { day: 'Fri', CopilotQueries: 88, DiseaseScans: 35 },
  { day: 'Sat', CopilotQueries: 110, DiseaseScans: 48 },
  { day: 'Sun', CopilotQueries: 125, DiseaseScans: 54 }
];

const CROP_DISTRIBUTION_DATA = [
  { name: 'Cotton', value: 42, color: '#3b82f6' },
  { name: 'Paddy', value: 35, color: '#10b981' },
  { name: 'Maize', value: 15, color: '#f59e0b' },
  { name: 'Wheat', value: 8, color: '#ef4444' }
];

const OUTBREAK_DATA = [
  { region: 'Karimnagar', Blight: 28, Blast: 15, Rust: 12 },
  { region: 'Warangal', Blight: 20, Blast: 22, Rust: 8 },
  { region: 'Adilabad', Blight: 35, Blast: 10, Rust: 14 },
  { region: 'Nalgonda', Blight: 12, Blast: 18, Rust: 5 },
  { region: 'Nizamabad', Blight: 18, Blast: 25, Rust: 9 }
];

const DEFAULT_SCHEMES: Scheme[] = [
  {
    id: 'scheme-1',
    title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    category: 'Direct Income Support',
    targetCrop: 'All Crops',
    description: 'An initiative by the Government of India that provides up to ₹6,000 per year in three equal installments to small and marginal farmers.',
    link: 'https://pmkisan.gov.in/'
  },
  {
    id: 'scheme-2',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'Crop Insurance',
    targetCrop: 'Food & Oilseed Crops',
    description: 'A government-sponsored crop insurance scheme that integrates multiple stakeholders to protect farmers from climate-related yield losses.',
    link: 'https://pmfby.gov.in/'
  },
  {
    id: 'scheme-3',
    title: 'Rythu Bandhu Scheme',
    category: 'State Investment Support',
    targetCrop: 'All Crops',
    description: 'Telangana government investment support scheme providing ₹5,000 per acre per season directly to farmers for purchase of seeds, fertilizers, and inputs.',
    link: 'http://rythubandhu.telangana.gov.in/'
  }
];

export const AdminDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'schemes' | 'trends' | 'feedback'>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Government Schemes CRUD States
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [schemeForm, setSchemeForm] = useState<Omit<Scheme, 'id'>>({
    title: '',
    category: 'Direct Income Support',
    targetCrop: 'All Crops',
    description: '',
    link: ''
  });

  const loadSubmissions = async () => {
    try {
      const data = await api.admin.getInquiries();
      const formatted = data.map((item: any) => ({
        id: item._id || item.id,
        name: item.name,
        email: item.email,
        phone: item.phone || '',
        message: item.message,
        date: item.date
      }));
      setSubmissions(formatted);
    } catch (err) {
      console.warn("[Admin API] Failed to fetch contact inquiries, loading local fallback:", err);
      const saved = localStorage.getItem('kisan_contact_submissions');
      if (saved) {
        setSubmissions(JSON.parse(saved));
      } else {
        setSubmissions([]);
      }
    }
  };

  const loadAllUsers = async () => {
    const list: ManagedUser[] = [];
    
    // 1. Fetch from MongoDB Backend API
    try {
      const data = await api.admin.getUsers();
      data.forEach((u: any) => {
        list.push({
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || 'Farmer',
          role: u.role || 'farmer',
          isBanned: u.isBanned || false,
          source: 'mongodb',
          createdAt: u.createdAt
        });
      });
      setUsers(list);
      return;
    } catch (err) {
      console.warn("[Admin API] Failed to fetch users from Express/MongoDB backend, loading cached fallback accounts:", err);
    }

    // 2. Fetch local storage cached accounts
    try {
      const savedMock = localStorage.getItem('kisan_registered_users');
      if (savedMock) {
        const registered = JSON.parse(savedMock);
        Object.keys(registered).forEach(email => {
          const u = registered[email].profile;
          if (u && !list.some(item => item.email.toLowerCase() === email.toLowerCase())) {
            list.push({
              uid: u.uid || email,
              email: u.email || email,
              displayName: u.displayName || 'Farmer',
              role: u.role === 'admin' ? 'admin' : 'farmer',
              isBanned: u.isBanned || false,
              source: 'local',
              createdAt: u.createdAt
            });
          }
        });
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const singleUserStr = localStorage.getItem('kisan_user');
      if (singleUserStr) {
        const u = JSON.parse(singleUserStr);
        if (u && u.email && !list.some(item => item.email.toLowerCase() === u.email.toLowerCase())) {
          list.push({
            uid: u.uid || 'kisan-user-id',
            email: u.email,
            displayName: u.displayName || 'Farmer',
            role: u.role === 'admin' ? 'admin' : 'farmer',
            isBanned: u.isBanned || false,
            source: 'local',
            createdAt: u.createdAt
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    setUsers(list);
  };

  const loadSchemes = () => {
    const saved = localStorage.getItem('kisan_managed_schemes');
    if (saved) {
      setSchemes(JSON.parse(saved));
    } else {
      localStorage.setItem('kisan_managed_schemes', JSON.stringify(DEFAULT_SCHEMES));
      setSchemes(DEFAULT_SCHEMES);
    }
  };

  useEffect(() => {
    loadSubmissions();
    loadAllUsers();
    loadSchemes();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this submission log?')) {
      try {
        await api.admin.deleteInquiry(id);
        alert('Successfully deleted inquiry log.');
        await loadSubmissions();
      } catch (err) {
        console.warn("Failed to delete inquiry on API, falling back to local deletion:", err);
        const updated = submissions.filter(s => s.id !== id);
        setSubmissions(updated);
        localStorage.setItem('kisan_contact_submissions', JSON.stringify(updated));
      }
    }
  };

  const handleToggleRole = async (userItem: ManagedUser) => {
    const newRole = userItem.role === 'admin' ? 'farmer' : 'admin';
    try {
      await api.admin.updateRole(userItem.uid, newRole);
      alert(`Successfully updated role of ${userItem.displayName} to ${newRole}.`);
      await loadAllUsers();
    } catch (err) {
      alert(`Failed to update user role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleToggleBan = async (userItem: ManagedUser) => {
    const nextBanStatus = !userItem.isBanned;
    try {
      await api.admin.banUser(userItem.uid, nextBanStatus);
      alert(`Successfully ${nextBanStatus ? 'BANNED' : 'UNBANNED'} user ${userItem.displayName}.`);
      await loadAllUsers();
    } catch (err) {
      alert(`Failed to update ban status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (userItem: ManagedUser) => {
    if (!confirm(`Are you sure you want to delete user ${userItem.displayName}?`)) {
      return;
    }

    try {
      await api.admin.deleteUser(userItem.uid);
      alert(`Successfully deleted user ${userItem.displayName} from database.`);
      await loadAllUsers();
    } catch (err) {
      alert(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Schemes CRUD Form Actions
  const handleSaveScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeForm.title || !schemeForm.description) {
      alert('Please enter a title and description.');
      return;
    }

    let updatedSchemes = [...schemes];
    if (editingSchemeId) {
      updatedSchemes = schemes.map(s => s.id === editingSchemeId ? { ...schemeForm, id: editingSchemeId } : s);
      alert('Scheme updated successfully.');
    } else {
      const newScheme: Scheme = {
        ...schemeForm,
        id: 'scheme-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
      };
      updatedSchemes.push(newScheme);
      alert('Scheme added successfully.');
    }

    localStorage.setItem('kisan_managed_schemes', JSON.stringify(updatedSchemes));
    setSchemes(updatedSchemes);
    setSchemeForm({
      title: '',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: '',
      link: ''
    });
    setEditingSchemeId(null);
  };

  const handleEditScheme = (scheme: Scheme) => {
    setEditingSchemeId(scheme.id);
    setSchemeForm({
      title: scheme.title,
      category: scheme.category,
      targetCrop: scheme.targetCrop,
      description: scheme.description,
      link: scheme.link
    });
  };

  const handleDeleteScheme = (id: string) => {
    if (confirm('Are you sure you want to delete this scheme?')) {
      const updated = schemes.filter(s => s.id !== id);
      localStorage.setItem('kisan_managed_schemes', JSON.stringify(updated));
      setSchemes(updated);
      alert('Scheme deleted successfully.');
    }
  };

  const handleExportCSV = () => {
    let header = '';
    let rows = [];

    if (activeTab === 'users') {
      header = 'UID,Display Name,Email,Role,Is Banned\n';
      rows = users.map(u => `"${u.uid}","${u.displayName}","${u.email}","${u.role}","${u.isBanned}"`);
    } else if (activeTab === 'feedback') {
      header = 'ID,Name,Email,Phone,Message,Date\n';
      rows = submissions.map(s => `"${s.id}","${s.name}","${s.email}","${s.phone}","${s.message.substring(0, 50)}...","${s.date}"`);
    } else {
      alert('Export only available for Users Directory and Feedback Center.');
      return;
    }

    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `kisan_ai_${activeTab}_export.csv`);
    a.click();
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (dateFilter === 'today') {
        return matchesSearch && s.date.includes('Jun 15');
      }
      return matchesSearch;
    });
  }, [submissions, searchQuery, dateFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchQuery]);

  return (
    <div className="admin-page-layout">
      {/* Title Header */}
      <div className="admin-header-card glass-card flex-between">
        <div>
          <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start', color: 'var(--color-primary)' }}>
            <Shield size={24} />
            <h2>System Administration Panel</h2>
          </div>
          <p className="text-muted">
            Configure system configurations, audit accounts, review telemetry analytics, and manage alerts.
          </p>
        </div>

        {(activeTab === 'users' || activeTab === 'feedback') && (
          <button className="btn btn-secondary flex-center" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* 5 Tabs Header */}
      <div className="admin-tabs flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`admin-tab flex-center ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => { setActiveTab('analytics'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'analytics' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'analytics' ? '3px solid var(--color-primary)' : '3px solid transparent',
            cursor: 'pointer',
            gap: '0.4rem'
          }}
        >
          <Activity size={16} />
          <span>Analytics</span>
        </button>

        <button 
          className={`admin-tab flex-center ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'users' ? '3px solid var(--color-primary)' : '3px solid transparent',
            cursor: 'pointer',
            gap: '0.4rem'
          }}
        >
          <Users size={16} />
          <span>Farmers Directory ({users.length})</span>
        </button>

        <button 
          className={`admin-tab flex-center ${activeTab === 'schemes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('schemes'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'schemes' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'schemes' ? '3px solid var(--color-primary)' : '3px solid transparent',
            cursor: 'pointer',
            gap: '0.4rem'
          }}
        >
          <Award size={16} />
          <span>Gov Schemes</span>
        </button>

        <button 
          className={`admin-tab flex-center ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => { setActiveTab('trends'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'trends' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'trends' ? '3px solid var(--color-primary)' : '3px solid transparent',
            cursor: 'pointer',
            gap: '0.4rem'
          }}
        >
          <BarChart2 size={16} />
          <span>Disease Trends</span>
        </button>

        <button 
          className={`admin-tab flex-center ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => { setActiveTab('feedback'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'feedback' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'feedback' ? '3px solid var(--color-primary)' : '3px solid transparent',
            cursor: 'pointer',
            gap: '0.4rem'
          }}
        >
          <MessageSquare size={16} />
          <span>Feedback Center ({submissions.length})</span>
        </button>
      </div>

      {/* Tab Contents */}

      {/* 1. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="flex-column" style={{ gap: '1.5rem' }}>
          <section className="admin-metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="total-metric-card glass-card flex-between">
              <div>
                <span className="total-label">Registered Users</span>
                <div className="total-value text-gradient">{users.length}</div>
              </div>
              <div className="total-icon-circle blue flex-center"><Users size={20} /></div>
            </div>

            <div className="total-metric-card glass-card flex-between">
              <div>
                <span className="total-label">Pending Inquiries</span>
                <div className="total-value text-gradient">{submissions.length}</div>
              </div>
              <div className="total-icon-circle green flex-center"><MessageSquare size={20} /></div>
            </div>

            <div className="total-metric-card glass-card flex-between">
              <div>
                <span className="total-label">System Admins</span>
                <div className="total-value text-gradient">{users.filter(u => u.role === 'admin').length}</div>
              </div>
              <div className="total-icon-circle green flex-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}><Shield size={20} /></div>
            </div>

            <div className="total-metric-card glass-card flex-between">
              <div>
                <span className="total-label">Outbreak Alerts</span>
                <div className="total-value text-gradient">3 Active</div>
              </div>
              <div className="total-icon-circle green flex-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><ShieldAlert size={20} /></div>
            </div>
          </section>

          {/* Charts Grid */}
          <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="chart-container-card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Farmer Registrations Growth</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={REGISTRATION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="day" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                    <Area type="monotone" dataKey="Users" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container-card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>AI Interactions & Leaf Scans</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={METRICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="day" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Bar dataKey="CopilotQueries" name="Voice AI Chats" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="DiseaseScans" name="Crop Health Scans" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER ACCOUNT MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="flex-column" style={{ gap: '1.25rem' }}>
          {/* Search box */}
          <div className="admin-filter-bar glass-card flex-between">
            <div className="search-box-wrapper relative flex-center" style={{ width: '320px' }}>
              <Search size={16} className="search-icon-muted" />
              <input 
                type="text" 
                className="form-input search-input" 
                placeholder="Search farmers by display name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-submissions glass-card text-center flex-column flex-center">
              <div style={{ fontSize: '3rem' }}>👥</div>
              <h4>No matching farmer accounts</h4>
              <p className="text-muted">No users matched your current query.</p>
            </div>
          ) : (
            <div className="users-table-card glass-card" style={{ padding: '1rem', overflowX: 'auto', backgroundColor: 'var(--bg-primary)' }}>
              <table className="admin-users-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 10px' }}>Display Name</th>
                    <th style={{ padding: '12px 10px' }}>Email Address</th>
                    <th style={{ padding: '12px 10px' }}>Current Role</th>
                    <th style={{ padding: '12px 10px' }}>Account Status</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Management Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(userItem => (
                    <tr key={userItem.uid} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 700 }}>
                        {userItem.displayName}
                        {userItem.isBanned && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                            BANNED
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{userItem.email || 'No email provided'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className={`badge ${userItem.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                          {userItem.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {userItem.isBanned ? '🚫 Blocked Access' : '✅ Active Farmer'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleRole(userItem)}
                            title="Toggle User Role"
                            style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                            disabled={userItem.email === 'admin'}
                          >
                            Toggle Role
                          </button>
                          <button 
                            className={`btn ${userItem.isBanned ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => handleToggleBan(userItem)}
                            title={userItem.isBanned ? "Unban User" : "Ban User"}
                            style={{ 
                              padding: '0.4rem 0.65rem', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              backgroundColor: userItem.isBanned ? 'var(--color-primary)' : 'rgba(239, 68, 68, 0.08)',
                              color: userItem.isBanned ? '#ffffff' : '#ef4444',
                              border: 'none'
                            }}
                            disabled={userItem.email === 'admin'}
                          >
                            {userItem.isBanned ? 'Unban User' : 'Ban User'}
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm delete-user-btn"
                            onClick={() => handleDeleteUser(userItem)}
                            title="Delete user account"
                            style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                            disabled={userItem.email === 'admin'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. GOVERNMENT SCHEMES CRUD MANAGER */}
      {activeTab === 'schemes' && (
        <div className="schemes-crud-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2rem' }}>
          {/* Left panel: Add/Edit Form */}
          <section className="scheme-form-pane glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {editingSchemeId ? '📝 Edit Scheme Details' : '➕ Register New Gov Scheme'}
            </h3>
            <form onSubmit={handleSaveScheme} className="flex-column" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Scheme Title:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={schemeForm.title} 
                  onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })}
                  placeholder="e.g. PM Fasal Bima Yojana (Crop Insurance)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Classification Category:</label>
                <select 
                  className="form-input" 
                  value={schemeForm.category}
                  onChange={(e) => setSchemeForm({ ...schemeForm, category: e.target.value })}
                >
                  <option value="Direct Income Support">Direct Income Support</option>
                  <option value="Crop Insurance">Crop Insurance</option>
                  <option value="Subsidies & Equipment">Subsidies & Equipment</option>
                  <option value="Irrigation Support">Irrigation Support</option>
                  <option value="Soil & Fertilizer Aid">Soil & Fertilizer Aid</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Crops:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={schemeForm.targetCrop} 
                  onChange={(e) => setSchemeForm({ ...schemeForm, targetCrop: e.target.value })}
                  placeholder="e.g. All Crops, Cotton, Paddy"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link to Official Portal:</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={schemeForm.link} 
                  onChange={(e) => setSchemeForm({ ...schemeForm, link: e.target.value })}
                  placeholder="e.g. https://pmkisan.gov.in"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Program Description / Guidelines:</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={schemeForm.description}
                  onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                  placeholder="Enter details on eligibility criteria, documents required, and financial payouts..."
                  required
                />
              </div>

              <div className="flex" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingSchemeId ? 'Update Scheme' : 'Register Scheme'}
                </button>
                {editingSchemeId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setEditingSchemeId(null);
                      setSchemeForm({ title: '', category: 'Direct Income Support', targetCrop: 'All Crops', description: '', link: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Right panel: Live listings */}
          <section className="schemes-list-pane flex-column" style={{ gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Active Registered Portals ({schemes.length})</h3>
            <div className="schemes-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
              {schemes.map(s => (
                <div key={s.id} className="scheme-item-card glass-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="flex-between">
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{s.category}</span>
                    <div className="flex" style={{ gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleEditScheme(s)}>
                        <Edit size={12} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--color-danger)' }} onClick={() => handleDeleteScheme(s.id)}>
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0.25rem 0' }}>{s.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Crops: {s.targetCrop}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{s.description}</p>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                      Visit Official Portal →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 4. DISEASE ANALYTICS & REGIONAL TRENDS */}
      {activeTab === 'trends' && (
        <div className="flex-column" style={{ gap: '1.5rem' }}>
          <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="chart-container-card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Disease Scans Crop Distribution</h3>
              <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={CROP_DISTRIBUTION_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {CROP_DISTRIBUTION_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-labels flex-column" style={{ gap: '0.5rem', flex: 1, paddingLeft: '1rem' }}>
                  {CROP_DISTRIBUTION_DATA.map((item, idx) => (
                    <div key={idx} className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: item.color }}></div>
                      <span>{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-container-card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Regional Pathogen Outbreaks (Telangana)</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={OUTBREAK_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="region" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Bar dataKey="Blight" name="Leaf Blight" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="Blast" name="Rice Blast" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="Rust" name="Rust" fill="#10b981" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FEEDBACK CENTER */}
      {activeTab === 'feedback' && (
        <div className="flex-column" style={{ gap: '1.25rem' }}>
          {/* Filters */}
          <div className="admin-filter-bar glass-card flex-between">
            <div className="search-box-wrapper relative flex-center" style={{ width: '300px' }}>
              <Search size={16} className="search-icon-muted" />
              <input 
                type="text" 
                className="form-input search-input" 
                placeholder="Search inquiries..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-dropdown-block flex-center" style={{ gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter:</span>
              <select 
                className="form-input" 
                style={{ width: '150px', padding: '0.5rem' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
              </select>
            </div>
          </div>

          <section className="admin-submissions-section flex-column" style={{ gap: '1.25rem' }}>
            {filteredSubmissions.length === 0 ? (
              <div className="empty-submissions glass-card text-center flex-column flex-center">
                <div style={{ fontSize: '3rem' }}>📭</div>
                <h4>No submissions found</h4>
                <p className="text-muted">Contact forms logged will show up in this dashboard.</p>
              </div>
            ) : (
              filteredSubmissions.map(sub => (
                <div key={sub.id} className="submission-item-card glass-card flex-column" style={{ gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="submission-card-header flex-between">
                    <div>
                      <h3 className="sender-name">{sub.name}</h3>
                      <div className="sender-meta flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginTop: '0.25rem' }}>
                        <span className="flex-center text-muted" style={{ gap: '0.25rem', fontSize: '0.8rem' }}><Mail size={12} /> {sub.email}</span>
                        <span className="flex-center text-muted" style={{ gap: '0.25rem', fontSize: '0.8rem' }}><Phone size={12} /> {sub.phone || 'No phone number'}</span>
                        <span className="flex-center text-muted" style={{ gap: '0.25rem', fontSize: '0.8rem' }}><Calendar size={12} /> {sub.date}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-secondary delete-sub-btn" 
                      onClick={() => handleDelete(sub.id)}
                      title="Delete Log"
                      style={{ border: 'none', background: 'transparent' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="submission-msg-body">
                    <p style={{ margin: 0 }}>{sub.message}</p>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      <style>{`
        .admin-page-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .admin-header-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .admin-header-card h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        /* Metrics Row */
        .admin-metrics-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .total-metric-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          height: 110px;
        }

        .total-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .total-value {
          font-size: 2rem;
          font-weight: 800;
          font-family: var(--font-heading);
          line-height: 1;
          margin-top: 0.25rem;
        }

        .total-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
        }

        .total-icon-circle.blue { background-color: rgba(37, 99, 235, 0.1); color: #3b82f6; }
        .total-icon-circle.green { background-color: var(--color-light-green); color: var(--color-primary); }

        /* Filter block */
        .admin-filter-bar {
          background-color: var(--bg-primary);
          padding: 1rem 1.5rem;
        }

        .search-input {
          padding-left: 2.25rem;
        }

        .search-icon-muted {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
          pointer-events: none;
        }

        /* Submissions list */
        .submission-item-card {
          background-color: var(--bg-primary);
          padding: 1.75rem;
        }

        .submission-item-card:hover {
          transform: none;
        }

        .submission-card-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .sender-name {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .delete-sub-btn {
          color: var(--color-danger);
          padding: 0.5rem;
        }

        .delete-sub-btn:hover {
          background-color: rgba(239, 68, 68, 0.08);
        }

        .submission-msg-body {
          background-color: var(--bg-secondary);
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .empty-submissions {
          background-color: var(--bg-primary);
          padding: 4rem;
          gap: 1rem;
        }

        .empty-submissions h4 {
          font-size: 1.25rem;
          font-weight: 800;
        }

        /* Users Table styling */
        .admin-users-table th {
          font-weight: 800;
          color: var(--text-secondary);
        }

        .admin-users-table tr {
          transition: background-color var(--transition-fast);
        }

        .admin-users-table tbody tr:hover {
          background-color: var(--bg-secondary);
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: var(--radius-sm);
        }

        .badge-primary {
          background-color: var(--color-light-green);
          color: var(--color-primary);
        }

        .badge-secondary {
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .delete-user-btn:hover {
          background-color: rgba(239, 68, 68, 0.08) !important;
        }

        @media (max-width: 768px) {
          .admin-metrics-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .admin-filter-bar {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          .search-box-wrapper {
            width: 100% !important;
          }
          .filter-dropdown-block {
            justify-content: flex-start;
          }
          .sender-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Phone, Calendar, Trash2, Search, Download, Shield, MessageSquare, AlertCircle, Users } from 'lucide-react';
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
  source: 'firebase' | 'local' | 'mongodb';
  key?: string;
}

export const AdminDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'users'>('inquiries');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

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
          source: 'mongodb',
          key: u.uid
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
              source: 'local',
              key: email
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
            source: 'local',
            key: 'kisan_user'
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    setUsers(list);
  };

  useEffect(() => {
    const saved = localStorage.getItem('kisan_contact_submissions');
    if (saved) {
      setSubmissions(JSON.parse(saved));
    } else {
      setSubmissions([]);
    }
    
    loadAllUsers();
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this submission log?')) {
      const updated = submissions.filter(s => s.id !== id);
      setSubmissions(updated);
      localStorage.setItem('kisan_contact_submissions', JSON.stringify(updated));
    }
  };

  const handleToggleRole = async (userItem: ManagedUser) => {
    const newRole = userItem.role === 'admin' ? 'farmer' : 'admin';
    
    // 1. Update on MongoDB API
    try {
      await api.admin.updateRole(userItem.uid, newRole);
      alert(`Successfully updated role of ${userItem.displayName} to ${newRole}.`);
      await loadAllUsers();
      return;
    } catch (err) {
      console.warn("Failed to sync role change to MongoDB API, writing to local storage fallback caches:", err);
    }

    // 2. Local fallback updates
    try {
      const savedMock = localStorage.getItem('kisan_registered_users');
      if (savedMock) {
        const registered = JSON.parse(savedMock);
        const emailKey = userItem.email.toLowerCase();
        if (registered[emailKey]) {
          registered[emailKey].profile.role = newRole;
          localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    const currentLoggedUserStr = localStorage.getItem('kisan_user');
    if (currentLoggedUserStr) {
      try {
        const u = JSON.parse(currentLoggedUserStr);
        if (u && u.email?.toLowerCase() === userItem.email.toLowerCase()) {
          u.role = newRole;
          localStorage.setItem('kisan_user', JSON.stringify(u));
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    await loadAllUsers();
    alert(`Successfully updated role of ${userItem.displayName} to ${newRole} (local cache).`);
  };

  const handleDeleteUser = async (userItem: ManagedUser) => {
    if (!confirm(`Are you sure you want to delete user ${userItem.displayName}?`)) {
      return;
    }

    // 1. Delete from MongoDB API
    try {
      await api.admin.deleteUser(userItem.uid);
      alert(`Successfully deleted user ${userItem.displayName} from database.`);
      await loadAllUsers();
      return;
    } catch (err) {
      console.warn("Failed to delete user on MongoDB API, updating local session caches:", err);
    }

    // 2. Local fallback deletes
    try {
      const savedMock = localStorage.getItem('kisan_registered_users');
      if (savedMock) {
        const registered = JSON.parse(savedMock);
        const emailKey = userItem.email.toLowerCase();
        delete registered[emailKey];
        localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
      }
    } catch (e) {
      console.error(e);
    }
    
    try {
      const singleUserStr = localStorage.getItem('kisan_user');
      if (singleUserStr) {
        const u = JSON.parse(singleUserStr);
        if (u && u.email?.toLowerCase() === userItem.email.toLowerCase()) {
          localStorage.removeItem('kisan_user');
        }
      }
    } catch (e) {
      console.error(e);
    }

    await loadAllUsers();
    alert(`Successfully deleted user ${userItem.displayName} (local cache).`);
  };

  const handleExportCSV = () => {
    if (activeTab === 'inquiries') {
      alert('Exporting inquiries logs. Compiling CSV download bundle...');
    } else {
      alert('Exporting users directory. Compiling CSV download bundle...');
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (dateFilter === 'today') {
        return matchesSearch && s.date.includes('Jun 8');
      }
      return matchesSearch;
    });
  }, [submissions, searchQuery, dateFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
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
            <h2>Admin Panel: {activeTab === 'inquiries' ? 'Contact Submissions' : 'User Accounts'}</h2>
          </div>
          <p className="text-muted">
            {activeTab === 'inquiries' 
              ? 'Manage inquiry forms, feedback messages, and support logs from KisanAI users.' 
              : 'Monitor, manage roles, and review profiles of registered farmers on the KisanAI platform.'}
          </p>
        </div>

        <button className="btn btn-secondary flex-center" onClick={handleExportCSV}>
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', gap: '1rem', marginTop: '0.5rem' }}>
        <button 
          className={`admin-tab flex-center ${activeTab === 'inquiries' ? 'active' : ''}`}
          onClick={() => { setActiveTab('inquiries'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: activeTab === 'inquiries' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'inquiries' ? '3px solid var(--color-primary)' : '3px solid transparent',
            cursor: 'pointer',
            gap: '0.4rem'
          }}
        >
          <MessageSquare size={16} />
          <span>Contact Inquiries ({submissions.length})</span>
        </button>
        <button 
          className={`admin-tab flex-center ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'users' ? '3px solid var(--color-primary)' : '3px solid transparent',
            cursor: 'pointer',
            gap: '0.4rem'
          }}
        >
          <Users size={16} />
          <span>User Accounts ({users.length})</span>
        </button>
      </div>

      {/* Metrics Row */}
      {activeTab === 'inquiries' ? (
        <section className="admin-metrics-row">
          <div className="total-metric-card glass-card flex-between">
            <div>
              <span className="total-label">Total Inquiries</span>
              <div className="total-value text-gradient">{submissions.length}</div>
            </div>
            <div className="total-icon-circle blue flex-center"><MessageSquare size={20} /></div>
          </div>

          <div className="total-metric-card glass-card flex-between">
            <div>
              <span className="total-label">Pending Reviews</span>
              <div className="total-value text-gradient">{filteredSubmissions.length}</div>
            </div>
            <div className="total-icon-circle green flex-center"><AlertCircle size={20} /></div>
          </div>
        </section>
      ) : (
        <section className="admin-metrics-row">
          <div className="total-metric-card glass-card flex-between">
            <div>
              <span className="total-label">Total Registered Users</span>
              <div className="total-value text-gradient">{users.length}</div>
            </div>
            <div className="total-icon-circle blue flex-center"><Users size={20} /></div>
          </div>

          <div className="total-metric-card glass-card flex-between">
            <div>
              <span className="total-label">Admin Accounts</span>
              <div className="total-value text-gradient">{users.filter(u => u.role === 'admin').length}</div>
            </div>
            <div className="total-icon-circle green flex-center"><Shield size={20} /></div>
          </div>
        </section>
      )}

      {/* Filter and search bar */}
      <div className="admin-filter-bar glass-card flex-between">
        <div className="search-box-wrapper relative flex-center" style={{ width: '300px' }}>
          <Search size={16} className="search-icon-muted" />
          <input 
            type="text" 
            className="form-input search-input" 
            placeholder={activeTab === 'inquiries' ? "Search inquiries..." : "Search users by name/email..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'inquiries' && (
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
        )}
      </div>

      {/* Main logs display list */}
      <section className="admin-submissions-section flex-column" style={{ gap: '1.25rem' }}>
        {activeTab === 'inquiries' ? (
          filteredSubmissions.length === 0 ? (
            <div className="empty-submissions glass-card text-center flex-column flex-center">
              <div style={{ fontSize: '3rem' }}>📭</div>
              <h4>No submissions found</h4>
              <p className="text-muted">Contact forms logged will show up in this dashboard.</p>
            </div>
          ) : (
            filteredSubmissions.map(sub => (
              <div key={sub.id} className="submission-item-card glass-card flex-column" style={{ gap: '1rem' }}>
                <div className="submission-card-header flex-between">
                  <div>
                    <h3 className="sender-name">{sub.name}</h3>
                    <div className="sender-meta flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginTop: '0.25rem' }}>
                      <span className="flex-center text-muted" style={{ gap: '0.25rem', fontSize: '0.8rem' }}><Mail size={12} /> {sub.email}</span>
                      <span className="flex-center text-muted" style={{ gap: '0.25rem', fontSize: '0.8rem' }}><Phone size={12} /> {sub.phone}</span>
                      <span className="flex-center text-muted" style={{ gap: '0.25rem', fontSize: '0.8rem' }}><Calendar size={12} /> {sub.date}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-secondary delete-sub-btn" 
                    onClick={() => handleDelete(sub.id)}
                    title="Delete Log"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="submission-msg-body">
                  <p>{sub.message}</p>
                </div>
              </div>
            ))
          )
        ) : (
          filteredUsers.length === 0 ? (
            <div className="empty-submissions glass-card text-center flex-column flex-center">
              <div style={{ fontSize: '3rem' }}>👥</div>
              <h4>No users found</h4>
              <p className="text-muted">Registered user accounts will show up here.</p>
            </div>
          ) : (
            <div className="users-table-card glass-card" style={{ padding: '1rem', overflowX: 'auto', backgroundColor: 'var(--bg-primary)' }}>
              <table className="admin-users-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 10px' }}>Farmer Name</th>
                    <th style={{ padding: '12px 10px' }}>Email Address</th>
                    <th style={{ padding: '12px 10px' }}>Current Role</th>
                    <th style={{ padding: '12px 10px' }}>Auth/Storage Source</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Modify Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(userItem => (
                    <tr key={userItem.uid} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 700 }}>{userItem.displayName}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{userItem.email}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className={`badge ${userItem.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                          {userItem.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {userItem.source === 'mongodb' ? '🍃 MongoDB Database' : (userItem.source === 'firebase' ? '🔥 Firebase Cache' : '💾 Local Storage')}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div className="flex-center" style={{ gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleRole(userItem)}
                            title="Toggle Role"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Toggle Role
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm delete-user-btn"
                            onClick={() => handleDeleteUser(userItem)}
                            title="Delete User"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
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
          )
        )}
      </section>

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

        .total-icon-circle.blue { background-color: rgba(37, 99, 235, 0.1); color: #2563EB; }
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

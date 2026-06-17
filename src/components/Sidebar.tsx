import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  Sprout, 
  CloudSun, 
  Camera, 
  Bot, 
  Wallet, 
  BarChart3, 
  Users, 
  FileText, 
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  Shield,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const schemesLabels: Record<string, string> = {
    en: 'Gov Schemes',
    te: 'ప్రభుత్వ పథకాలు',
    hi: 'सरकारी योजनाएं',
    ta: 'அரசு திட்டங்கள்',
    kn: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು',
    mr: 'सरकारी योजना',
    gu: 'સરકારી યોજનાઓ',
    bn: 'সরকারি প্রকল্প',
    pa: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ',
    ml: 'സർക്കാർ പദ്ധതികൾ'
  };

  const menuItems = user?.role === 'admin'
    ? [
        { path: '/admin', label: 'Admin Panel', icon: Shield },
        { path: '/profile', label: t('nav.profile'), icon: User }
      ]
    : [
        { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/farms', label: t('nav.myFarms'), icon: Sprout },
        { path: '/weather', label: t('nav.weather'), icon: CloudSun },
        { path: '/disease', label: t('nav.disease'), icon: Camera },
        { path: '/copilot', label: t('nav.aiCopilot'), icon: Bot },
        { path: '/schemes', label: schemesLabels[language] || 'Gov Schemes', icon: Award },
        { path: '/cashbook', label: t('nav.cashbook'), icon: Wallet },
        { path: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
        { path: '/community', label: t('nav.community'), icon: Users },
        { path: '/reports', label: t('nav.reports'), icon: FileText },
        { path: '/profile', label: t('nav.profile'), icon: User }
      ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-logo">
            <span className="logo-icon">🌾</span>
            <span className="logo-text">{t('brand.name')}</span>
          </div>
        )}
        {collapsed && (
          <div className="sidebar-logo flex-center">
            <span className="logo-icon" style={{ fontSize: '1.5rem' }}>🌾</span>
          </div>
        )}
        <button 
          className="sidebar-toggle-btn flex-center"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="link-icon" />
              {!collapsed && <span className="link-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-primary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 100;
          transition: width var(--transition-normal);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .sidebar-header {
          height: var(--navbar-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          border-bottom: 1px solid var(--border-color);
          position: relative;
        }

        .sidebar.collapsed .sidebar-header {
          justify-content: center;
          padding: 0;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          font-size: 1.25rem;
        }

        .logo-text {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-primary);
        }

        .sidebar-toggle-btn {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background-color: var(--color-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          z-index: 110;
          transition: transform var(--transition-fast), background-color var(--transition-fast);
          flex-shrink: 0;
        }

        .sidebar-toggle-btn:hover {
          transform: translateY(-50%) scale(1.15);
          background-color: var(--color-primary-hover);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem 0.75rem;
          flex-grow: 1;
        }

        .sidebar.collapsed .sidebar-nav {
          padding: 1rem 0.5rem;
          align-items: center;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .sidebar.collapsed .sidebar-link {
          justify-content: center;
          width: 44px;
          height: 44px;
          padding: 0;
        }

        .sidebar-link:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background-color: var(--color-light-green);
          color: var(--color-primary);
          font-weight: 600;
        }

        html[data-theme='dark'] .sidebar-link.active {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .link-icon {
          flex-shrink: 0;
        }

        .link-label {
          white-space: nowrap;
          opacity: 1;
          transition: opacity var(--transition-normal);
        }

        .sidebar.collapsed .link-label {
          opacity: 0;
          width: 0;
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 100;
            width: var(--sidebar-width) !important;
            transition: transform var(--transition-normal);
            box-shadow: var(--shadow-xl);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .sidebar-toggle-btn {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
};

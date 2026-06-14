import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../context/LanguageContext';
import { useFarms } from '../context/FarmContext';
import { Bell, Sun, Moon, Globe, LogOut, Check, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { alerts, markAlertAsRead } = useFarms();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('kisan_theme') as 'light' | 'dark') || 'light';
  });
  
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kisan_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setShowLangDropdown(false);
  };

  const handleLogout = async () => {
    navigate('/');
    setTimeout(async () => {
      await logout();
    }, 100);
  };

  const unreadAlerts = alerts.filter(a => !a.read);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2 className="navbar-greeting">
          {t('dash.welcome')} {user?.displayName || 'Farmer'}
        </h2>
      </div>

      <div className="navbar-right">
        {/* Language Switcher */}
        <div className="dropdown-container">
          <button 
            className="navbar-btn flex-center"
            onClick={() => {
              setShowLangDropdown(!showLangDropdown);
              setShowBellDropdown(false);
              setShowProfileDropdown(false);
            }}
            title="Switch Language"
          >
            <Globe size={18} />
            <span className="navbar-btn-text">
              {language === 'en' ? 'English' : 
               language === 'te' ? 'తెలుగు' : 
               language === 'hi' ? 'हिन्दी' : 
               language === 'gu' ? 'ગુજરાતી' : 
               language === 'mr' ? 'मराठी' : 
               language === 'ta' ? 'தமிழ்' : 
               language === 'kn' ? 'ಕನ್ನಡ' : 
               language === 'bn' ? 'বাংলা' : 
               language === 'pa' ? 'ਪੰਜਾਬੀ' : 
               language === 'ml' ? 'മലയാളം' : 'English'}
            </span>
            <ChevronDown size={14} />
          </button>
          
          {showLangDropdown && (
            <div className="nav-dropdown dropdown-right" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {([
                { code: 'en', label: 'English' },
                { code: 'te', label: 'తెలుగు' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'gu', label: 'ગુજરાતી' },
                { code: 'mr', label: 'मराठी' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'kn', label: 'ಕನ್ನಡ' },
                { code: 'bn', label: 'বাংলা' },
                { code: 'pa', label: 'ਪੰਜਾਬੀ' },
                { code: 'ml', label: 'മലയാളം' }
              ] as { code: Language; label: string }[]).map((lang) => (
                <button 
                  key={lang.code}
                  className={`dropdown-item ${language === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <span>{lang.label}</span>
                  {language === lang.code && <Check size={14} className="check-icon" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          className="navbar-btn flex-center theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications (Bell) */}
        <div className="dropdown-container">
          <button 
            className="navbar-btn flex-center relative"
            onClick={() => {
              setShowBellDropdown(!showBellDropdown);
              setShowLangDropdown(false);
              setShowProfileDropdown(false);
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadAlerts.length > 0 && (
              <span className="notification-badge flex-center">{unreadAlerts.length}</span>
            )}
          </button>

          {showBellDropdown && (
            <div className="nav-dropdown dropdown-right notifications-dropdown">
              <div className="dropdown-header">
                <h3>{t('dash.activeAlerts')}</h3>
                <span className="unread-count">{unreadAlerts.length} unread</span>
              </div>
              <div className="notifications-list">
                {alerts.length === 0 ? (
                  <div className="empty-notifications">No warnings reported.</div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`notification-item ${alert.read ? 'read' : 'unread'} severity-${alert.severity}`}
                      onClick={() => markAlertAsRead(alert.id)}
                    >
                      <div className="notification-meta">
                        <span className="notification-farm">{alert.farmName}</span>
                        <span className="notification-date">{alert.date}</span>
                      </div>
                      <p className="notification-text">{alert.message}</p>
                      {!alert.read && <span className="mark-read-hint">Click to mark read</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Popover */}
        <div className="dropdown-container">
          <div 
            className="navbar-avatar-btn"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowLangDropdown(false);
              setShowBellDropdown(false);
            }}
          >
            <img 
              src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=128'} 
              alt="User profile photo" 
              className="user-avatar"
            />
          </div>

          {showProfileDropdown && (
            <div className="nav-dropdown dropdown-right profile-dropdown">
              <div className="user-profile-header">
                <span className="profile-name">{user?.displayName || 'Farmer'}</span>
                <span className="profile-email">{user?.email || 'farmer@kisanai.com'}</span>
              </div>
              <button 
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          height: var(--navbar-height);
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .navbar-greeting {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .navbar-btn {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          height: 40px;
          padding: 0 1rem;
          border-radius: var(--radius-md);
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 600;
          gap: 0.5rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .navbar-btn:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .navbar-btn-text {
          display: block;
        }

        @media (max-width: 640px) {
          .navbar {
            padding: 0 1rem;
          }
          .navbar-greeting {
            font-size: 1rem;
          }
          .navbar-btn-text {
            display: none;
          }
        }

        .relative {
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background-color: var(--color-danger);
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          border: 2px solid var(--bg-primary);
        }

        .navbar-avatar-btn {
          cursor: pointer;
          display: flex;
          align-items: center;
          border-radius: var(--radius-full);
          padding: 2px;
          border: 2px solid transparent;
          transition: border-color var(--transition-fast);
        }

        .navbar-avatar-btn:hover {
          border-color: var(--color-primary);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        /* Dropdowns */
        .dropdown-container {
          position: relative;
        }

        .nav-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 180px;
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
          z-index: 150;
          animation: fadeInUp var(--transition-fast) forwards;
        }

        .dropdown-right {
          right: 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.8rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all var(--transition-fast);
          gap: 0.5rem;
        }

        .dropdown-item:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .dropdown-item.active {
          color: var(--color-primary);
          background-color: var(--color-light-green);
          font-weight: 600;
        }

        html[data-theme='dark'] .dropdown-item.active {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .check-icon {
          color: var(--color-primary);
        }

        /* Notifications Dropdown Specifics */
        .notifications-dropdown {
          width: 320px;
          padding: 0;
          max-height: 450px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .dropdown-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dropdown-header h3 {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .unread-count {
          font-size: 0.75rem;
          background-color: var(--color-light-green);
          color: var(--color-primary);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
          font-weight: 600;
        }

        html[data-theme='dark'] .unread-count {
          background-color: rgba(22, 163, 74, 0.2);
        }

        .notifications-list {
          overflow-y: auto;
          flex-grow: 1;
        }

        .empty-notifications {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background-color var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .notification-item:hover {
          background-color: var(--bg-secondary);
        }

        .notification-item.unread {
          background-color: rgba(22, 163, 74, 0.03);
          border-left: 3px solid var(--color-primary);
        }

        .notification-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .notification-farm {
          color: var(--color-primary);
        }

        .notification-date {
          color: var(--text-muted);
        }

        .notification-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .mark-read-hint {
          align-self: flex-end;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-decoration: underline;
        }

        /* Profile Dropdown Specifics */
        .profile-dropdown {
          width: 220px;
        }

        .user-profile-header {
          padding: 0.8rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .profile-name {
          font-family: var(--font-heading);
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .profile-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .logout-btn {
          color: var(--color-danger);
          margin-top: 0.5rem;
        }

        .logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.08);
          color: var(--color-danger);
        }
      `}</style>
    </header>
  );
};

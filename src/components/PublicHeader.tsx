import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Menu, X } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/features', label: 'Features' },
    { path: '/community-preview', label: 'Community Hub' },
    { path: '/about', label: 'About Us' },
    { path: '/faq', label: 'FAQs' },
    { path: '/contact', label: 'Contact Us' }
  ];

  const handleCta = () => {
    if (user) {
      navigate(user.isOnboarded ? '/dashboard' : '/onboarding');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={`public-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container flex-between">
        {/* Logo */}
        <NavLink to="/" className="public-logo flex-center" onClick={() => setMobileMenuOpen(false)}>
          <span className="logo-icon">🌾</span>
          <div className="logo-text-block">
            <span className="logo-title">KisanAI</span>
            <span className="logo-sub">Smart Agritech Operating System</span>
          </div>
        </NavLink>

        {/* Center Nav Links (Desktop) */}
        <nav className="desktop-nav flex-center">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions (Desktop) */}
        <div className="desktop-actions flex-center">
          {/* Dashboard/Login Button */}
          {user ? (
            <div className="flex-center" style={{ gap: '0.75rem' }}>
              <button className="btn btn-secondary nav-cta-btn flex-center" onClick={handleLogout}>
                <span>Logout</span>
              </button>
              <button className="btn btn-primary nav-cta-btn flex-center" onClick={handleCta}>
                <span>Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary nav-cta-btn flex-center" onClick={handleCta}>
              <span>Register / Log In</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-controls flex-center">
          <button className="mobile-menu-btn flex-center" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <nav className="mobile-nav-links flex-column">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="mobile-drawer-divider"></div>

            <div className="mobile-drawer-actions flex-column" style={{ gap: '1rem' }}>
              {/* Mobile CTA */}
              {user ? (
                <div className="flex-column" style={{ gap: '0.75rem', width: '100%' }}>
                  <button className="btn btn-primary flex-center" style={{ width: '100%' }} onClick={() => {
                    setMobileMenuOpen(false);
                    handleCta();
                  }}>
                    <span>Dashboard</span>
                    <ArrowRight size={16} />
                  </button>
                  <button className="btn btn-secondary flex-center" style={{ width: '100%' }} onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}>
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary flex-center" style={{ width: '100%' }} onClick={() => {
                  setMobileMenuOpen(false);
                  handleCta();
                }}>
                  <span>Register / Log In</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .public-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background-color: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid var(--border-color);
          z-index: 1000;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all var(--transition-normal);
        }

        .public-header.scrolled {
          height: 70px;
          box-shadow: var(--shadow-md);
          background-color: rgba(255, 255, 255, 0.98);
        }

        .header-container {
          max-width: 1280px;
          height: 100%;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .public-logo {
          text-decoration: none;
          gap: 0.75rem;
          justify-content: flex-start;
        }

        .logo-icon {
          font-size: 2.25rem;
        }

        .logo-text-block {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .logo-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-primary);
          line-height: 1.2;
        }

        .logo-sub {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Desktop Nav */
        .desktop-nav {
          gap: 2rem;
        }

        .nav-item-link {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 0.5rem 0.25rem;
          position: relative;
          transition: color var(--transition-fast);
        }

        .nav-item-link:hover {
          color: var(--color-primary);
        }

        .nav-item-link.active {
          color: var(--color-primary);
        }

        .nav-item-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2.5px;
          background-color: var(--color-primary);
          border-radius: var(--radius-full);
        }

        /* Desktop Actions */
        .desktop-actions {
          gap: 1.25rem;
        }

        .nav-cta-btn {
          font-size: 0.85rem;
          padding: 0.6rem 1.2rem;
          border-radius: var(--radius-md);
        }

        /* Mobile controls */
        .mobile-controls {
          display: none;
        }

        .mobile-menu-btn {
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.5rem;
        }

        /* Mobile drawer overlay */
        .mobile-drawer-overlay {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          justify-content: flex-end;
        }

        .public-header.scrolled + .mobile-drawer-overlay {
          top: 70px;
        }

        .mobile-drawer-content {
          width: 80%;
          max-width: 320px;
          background-color: var(--bg-primary);
          height: 100%;
          box-shadow: var(--shadow-xl);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .mobile-nav-links {
          align-items: flex-start;
          gap: 1.5rem;
        }

        .mobile-nav-item {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-secondary);
          width: 100%;
          padding: 0.25rem 0;
        }

        .mobile-nav-item.active {
          color: var(--color-primary);
        }

        .mobile-drawer-divider {
          height: 1px;
          background-color: var(--border-color);
        }

        @media (max-width: 992px) {
          .desktop-nav, .desktop-actions {
            display: none;
          }
          .mobile-controls {
            display: flex;
          }
        }

        @media (max-width: 576px) {
          .logo-sub {
            display: none;
          }
          .header-container {
            padding: 0 1rem;
          }
        }
      `}</style>
    </header>
  );
};

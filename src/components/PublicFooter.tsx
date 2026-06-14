import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Mail, MapPin, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="public-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col flex-column">
            <NavLink to="/" className="footer-logo flex-center">
              <span className="logo-emoji">🌾</span>
              <span className="logo-text">KisanAI</span>
            </NavLink>
            <p className="footer-tagline-text">Smart Agritech Operating System</p>
            <p className="footer-founder-info">
              Founder: <strong>Abhiram Pulkam</strong><br />
              Karimnagar, Telangana, India
            </p>
            <div className="footer-socials flex-center">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon-link flex-center">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon-link flex-center">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon-link flex-center">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-links-col">
            <h4>Product</h4>
            <nav className="footer-nav-col flex-column">
              <NavLink to="/features" className="footer-item-link">Features</NavLink>
              <NavLink to="/community-preview" className="footer-item-link">Community Hub</NavLink>
              <NavLink to="/login" className="footer-item-link">Register / Log In</NavLink>
            </nav>
          </div>

          {/* Resources Links */}
          <div className="footer-links-col">
            <h4>Resources</h4>
            <nav className="footer-nav-col flex-column">
              <NavLink to="/faq" className="footer-item-link">FAQs</NavLink>
              <NavLink to="/contact" className="footer-item-link">Contact Us</NavLink>
            </nav>
          </div>

          {/* Contact Details */}
          <div className="footer-links-col">
            <h4>Contact Info</h4>
            <div className="footer-contact-details flex-column">
              <div className="contact-row flex-center">
                <Mail size={16} className="contact-icon" />
                <span>info@kisanai.in</span>
              </div>
              <div className="contact-row flex-center" style={{ alignItems: 'flex-start' }}>
                <MapPin size={16} className="contact-icon" style={{ marginTop: '3px' }} />
                <span>Karimnagar, Telangana,<br />India - 505001</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom flex-between">
          <p className="copyright-text">
            © {new Date().getFullYear()} KisanAI. All rights reserved.
          </p>
          <p className="dev-text flex-center">
            Built for Bharat with <Heart size={14} className="heart-icon" /> by Abhiram Pulkam.
          </p>
        </div>
      </div>

      <style>{`
        .public-footer {
          background-color: #0F172A;
          color: #94A3B8;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 5rem 2rem 2rem 2rem;
          width: 100%;
        }

        html[data-theme='dark'] .public-footer {
          background-color: #020617;
          border-top-color: rgba(255, 255, 255, 0.04);
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 4rem;
          padding-bottom: 4rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-brand-col {
          align-items: flex-start;
          gap: 1.25rem;
        }

        .footer-logo {
          text-decoration: none;
          gap: 0.5rem;
        }

        .logo-emoji {
          font-size: 1.75rem;
        }

        .logo-text {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
          color: #FFFFFF;
        }

        .footer-tagline-text {
          font-size: 0.9rem;
          line-height: 1.5;
          color: #64748B;
        }

        .footer-founder-info {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #94A3B8;
        }

        .footer-socials {
          gap: 1rem;
          justify-content: flex-start;
          margin-top: 0.5rem;
        }

        .social-icon-link {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background-color: rgba(255, 255, 255, 0.05);
          color: #E2E8F0;
          transition: all var(--transition-fast);
        }

        .social-icon-link:hover {
          background-color: var(--color-primary);
          color: #FFFFFF;
          transform: translateY(-2px);
        }

        /* Nav Columns */
        .footer-links-col h4 {
          font-size: 0.9rem;
          font-weight: 700;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
          font-family: var(--font-heading);
        }

        .footer-nav-col {
          align-items: flex-start;
          gap: 0.75rem;
        }

        .footer-item-link {
          font-size: 0.9rem;
          color: #94A3B8;
          transition: color var(--transition-fast);
          text-decoration: none;
        }

        .footer-item-link:hover {
          color: var(--color-primary);
        }

        .footer-contact-details {
          align-items: flex-start;
          gap: 1rem;
        }

        .contact-row {
          gap: 0.75rem;
          font-size: 0.9rem;
          justify-content: flex-start;
        }

        .contact-icon {
          color: var(--color-primary);
          flex-shrink: 0;
        }

        /* Footer Bottom */
        .footer-bottom {
          padding-top: 2rem;
          font-size: 0.85rem;
          color: #64748B;
        }

        .heart-icon {
          color: #EF4444;
          margin: 0 0.25rem;
        }

        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 3rem;
          }
        }

        @media (max-width: 576px) {
          .public-footer {
            padding: 4rem 1rem 2rem 1rem;
          }
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
};

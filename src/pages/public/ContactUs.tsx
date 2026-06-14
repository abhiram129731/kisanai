import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.contact.submit({
        name,
        email,
        phone,
        message
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('[Contact Form] Submit error:', err);
      setError(err.message || 'Failed to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const slideDown = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } }
  };
  const slideUp = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div className="contact-page-root">
      <div className="contact-inner flex-column">
        {/* Title */}
        <motion.div 
          variants={slideDown} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          className="contact-title-header text-center"
        >
          <span className="section-badge">📞 Connect</span>
          <h1>Contact KisanAI</h1>
          <p>Have questions or need assistance with KisanAI? Write to us directly.</p>
        </motion.div>

        {/* Contact Split */}
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="contact-main-grid"
        >
          {/* Left: Contact Form */}
          <motion.div variants={slideUp} className="contact-form-card glass-card flex-column">
            <h2>Send a Message</h2>
            <p>Our agricultural tech advisors will review your notes and respond within 24 hours.</p>

            {success && (
              <div className="success-toast-message flex-center">
                <CheckCircle size={18} />
                <span>Thank you! Your message has been sent successfully.</span>
              </div>
            )}

            {error && (
              <div className="error-toast-message flex-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 700, gap: '0.5rem', marginBottom: '1rem' }}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form-body flex-column" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="e.g. Ramesh Pulkam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-row-split flex-between" style={{ gap: '1rem' }}>
                <div className="form-group flex-1">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    required
                    placeholder="ramesh@kisanai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Message / Details *</label>
                <textarea 
                  className="form-input" 
                  rows={4}
                  required
                  placeholder="How can KisanAI help you? (e.g. problem drawing coordinates, expert booking support...)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* Right: Contact Coordinates & Details */}
          <motion.div variants={slideUp} className="contact-info-card glass-card flex-column" style={{ gap: '2rem' }}>
            <div>
              <h3>Contact Details</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Feel free to reach out via email or visit our Karimnagar hub.</p>
            </div>

            <div className="coords-list flex-column" style={{ gap: '1.5rem' }}>
              <div className="coord-row flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <div className="coord-icon-circle flex-center"><Mail size={18} /></div>
                <div>
                  <span className="coord-lbl text-muted">Send Email</span>
                  <strong className="coord-val">info@kisanai.in</strong>
                </div>
              </div>

              <div className="coord-row flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <div className="coord-icon-circle flex-center"><Phone size={18} /></div>
                <div>
                  <span className="coord-lbl text-muted">Call Support</span>
                  <strong className="coord-val">+91 98765 43210</strong>
                </div>
              </div>

              <div className="coord-row flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', alignItems: 'flex-start' }}>
                <div className="coord-icon-circle flex-center" style={{ marginTop: '4px' }}><MapPin size={18} /></div>
                <div>
                  <span className="coord-lbl text-muted">Geographic Hub</span>
                  <strong className="coord-val" style={{ display: 'block', lineHeight: 1.4 }}>
                    Karimnagar, Telangana,<br />
                    India - 505001
                  </strong>
                </div>
              </div>
            </div>

            <div className="divider-line"></div>

            <div className="socials-box">
              <h4>Follow Our Progress</h4>
              <div className="social-row flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginTop: '0.75rem' }}>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon-btn flex-center">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon-btn flex-center">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon-btn flex-center">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        .contact-page-root {
          background-color: var(--bg-secondary);
          min-height: 100vh;
          width: 100%;
          padding: 3rem 2rem 5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .contact-inner {
          max-width: 1100px;
          width: 100%;
          gap: 2.5rem;
        }

        .contact-title-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .contact-title-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0.5rem auto 0 auto;
          line-height: 1.5;
        }

        /* Main layout split */
        .contact-main-grid {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 2rem;
        }

        .contact-form-card {
          background-color: var(--bg-primary);
          padding: 3rem;
          gap: 1.25rem;
        }

        .contact-form-card:hover {
          transform: none;
        }

        .contact-form-card h2 {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .contact-form-card p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .success-toast-message {
          background-color: var(--color-light-green);
          color: var(--color-primary-hover);
          border: 1px solid rgba(22, 163, 74, 0.2);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          font-weight: 700;
          gap: 0.5rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Info card */
        .contact-info-card {
          background-color: var(--bg-primary);
          padding: 2.5rem;
        }

        .contact-info-card:hover {
          transform: none;
        }

        .contact-info-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .coord-icon-circle {
          width: 40px;
          height: 40px;
          background-color: var(--color-light-green);
          color: var(--color-primary);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        html[data-theme='dark'] .coord-icon-circle {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .coord-lbl {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
        }

        .coord-val {
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .divider-line {
          height: 1px;
          background-color: var(--border-color);
        }

        .socials-box h4 {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .social-icon-btn {
          width: 38px;
          height: 38px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .social-icon-btn:hover {
          background-color: var(--color-primary);
          color: #FFFFFF;
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        @media (max-width: 900px) {
          .contact-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .contact-page-root {
            padding: 3rem 1rem 5rem 1rem;
          }
          .contact-form-card {
            padding: 2rem 1.5rem;
          }
          .form-row-split {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

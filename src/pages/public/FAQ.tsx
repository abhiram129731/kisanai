import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';

export const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqsList = [
    {
      q: 'Is KisanAI free for smallholder farmers?',
      a: 'Yes. All core features including multi-farm satellite coordinate mapping, cashbook logs, weather telemetry forecasts, and leaf scanning diagnostics are completely free. Access to certified consultant phone call bookings is subsidized through cooperative programs.'
    },
    {
      q: 'Which languages are supported?',
      a: 'We natively support English, Telugu (తెలుగు), and Hindi (हिन्दी). This localization covers the complete user interface, scheme guides, and voice-assisted speech copilot commands.'
    },
    {
      q: 'Can I manage multiple separate farms?',
      a: 'Yes, you can register and save separate boundaries for multiple plots. The cashbook ledger also allows you to link expenditures and harvest sales to individual farms to view discrete crop profitability.'
    },
    {
      q: 'How accurate is the computer vision disease detection?',
      a: 'Our models achieve a 96% diagnostic accuracy rate for major Indian crops (Cotton, Paddy, and Maize). They evaluate visual blight, fungus, or spot damage instantly from camera scans.'
    },
    {
      q: 'Is the weather intelligence farm-specific?',
      a: 'Yes, KisanAI maps the precise GPS boundary coordinates you draw on our satellite overlay. It requests dedicated microclimate metrics rather than relying on standard district weather stations.'
    },
    {
      q: 'Does KisanAI work when I lose internet connectivity on the field?',
      a: 'Yes. KisanAI is optimized for low-connectivity agricultural areas. The web application uses secure local storage caching in your browser to save cashbook entries, crop disease diagnoses, and farm details while you are offline, and automatically syncs them to the server when connection is restored.'
    }
  ];

  const filteredFaqs = faqsList.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="faq-page-root">
      <div className="faq-inner flex-column">
        {/* Title */}
        <motion.div 
          variants={slideDown} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          className="faq-title-header text-center"
        >
          <span className="section-badge">❓ Help Center</span>
          <h1>Frequently Asked Questions</h1>
          <p>Get answers to standard questions about KisanAI's agricultural dashboard, mobile app support, and data privacy policies.</p>
          
          <div className="faq-search-wrapper relative flex-center">
            <Search size={18} className="search-icon-muted" />
            <input 
              type="text" 
              className="form-input search-input" 
              placeholder="Search questions or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* FAQ List */}
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="faq-accordions-list flex-column"
        >
          {filteredFaqs.length === 0 ? (
            <div className="empty-faq text-center">
              <h4>No questions match your search query.</h4>
              <p className="text-muted">Try searching for simple words like "free", "language", or "offline".</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              // Map index to match actual list item
              const originalIndex = faqsList.findIndex(item => item.q === faq.q);
              return (
                <motion.div 
                  key={idx} 
                  variants={slideUp}
                  className={`faq-item-card ${activeFaq === originalIndex ? 'expanded' : ''}`}
                  onClick={() => setActiveFaq(activeFaq === originalIndex ? null : originalIndex)}
                >
                  <div className="faq-card-header flex-between">
                    <div className="flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start' }}>
                      <HelpCircle size={18} className={activeFaq === originalIndex ? 'green-text' : 'text-muted'} />
                      <h3>{faq.q}</h3>
                    </div>
                    <ChevronDown size={20} className="accordion-chevron" />
                  </div>
                  <div className="faq-card-body">
                    <p>{faq.a}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      <style>{`
        .faq-page-root {
          background-color: var(--bg-secondary);
          min-height: 100vh;
          width: 100%;
          padding: 3rem 2rem 5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .faq-inner {
          max-width: 800px;
          width: 100%;
          gap: 2.5rem;
        }

        .faq-title-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .faq-title-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0.5rem auto 1.5rem auto;
          line-height: 1.5;
        }

        .faq-search-wrapper {
          max-width: 440px;
          width: 100%;
          margin: 0 auto;
        }

        .search-input {
          padding-left: 2.5rem;
          border-radius: var(--radius-md);
        }

        .search-icon-muted {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        /* Accordions List */
        .faq-accordions-list {
          gap: 1rem;
          width: 100%;
        }

        .faq-item-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .faq-item-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .faq-card-header {
          gap: 1.5rem;
        }

        .faq-card-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.4;
        }

        .accordion-chevron {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }

        .faq-item-card.expanded .accordion-chevron {
          transform: rotate(180deg);
          color: var(--color-primary);
        }

        .faq-card-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height var(--transition-fast);
        }

        .faq-item-card.expanded .faq-card-body {
          max-height: 300px;
          margin-top: 1rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }

        .faq-card-body p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .green-text {
          color: var(--color-primary);
        }

        .empty-faq {
          background-color: var(--bg-primary);
          padding: 3rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .empty-faq h4 {
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        @media (max-width: 768px) {
          .faq-page-root {
            padding: 3rem 1rem 5rem 1rem;
          }
          .faq-item-card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

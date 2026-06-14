import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { Landmark, Users, MapPin, Award, Calendar, Milestone, Heart } from 'lucide-react';

export const About: React.FC = () => {
  const { t } = useLanguage();

  const metrics = [
    { icon: MapPin, label: 'Origin Zone', val: 'Karimnagar, TS' },
    { icon: Users, label: 'Farmers Connected', val: '12,000+' },
    { icon: Award, label: 'Diagnostics Accuracy', val: '96%' }
  ];



  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' as const } }
  };
  const slideDown = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } }
  };
  const slideUp = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
  };
  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' as const } }
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
    <div className="about-premium-root">
      {/* Background glowing decorations */}
      <div className="glow-circle glow-circle-1" />
      <div className="glow-circle glow-circle-2" />

      <div className="about-premium-container">
        {/* Hero Section */}
        <motion.section 
          variants={slideDown} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          className="about-hero text-center"
        >
          <span className="section-badge">🌾 About KisanAI</span>
          <h1 className="hero-heading">Empowering Bharat's Farmers Through Intelligence</h1>
          <p className="hero-subheading">We build advanced, regional agritech solutions that turn data, computer vision, and weather indicators into secure profits on the field.</p>
        </motion.section>

        {/* Operational Metrics Row */}
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="metrics-tour-row"
        >
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <motion.div key={idx} variants={slideUp} className="metric-tour-card glass-card flex-center">
                <div className="metric-icon-circle flex-center">
                  <Icon size={20} />
                </div>
                <div className="metric-tour-txt flex-column">
                  <span className="metric-label">{m.label}</span>
                  <span className="metric-val">{m.val}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Double column story and mission splits */}
        <div className="about-split-grid">
          {/* Left panel: Our Story */}
          <motion.div 
            variants={slideUp} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            className="split-story-card glass-card flex-column"
          >
            <div className="section-header flex-center">
              <span className="header-emoji">📖</span>
              <h2>Our Story</h2>
            </div>
            <p>
              KisanAI was founded by <strong>Abhiram Pulkam</strong> in Karimnagar, Telangana, India. Having watched regional cotton and paddy farmers struggle against unpredictable weather patterns, sudden pest outbreaks, and untracked expenditures, he realized that advanced data tools should not be restricted to large-scale corporations.
            </p>
            <p>
              We built KisanAI to bridge this gap. By adapting state-of-the-art computer vision models and localizing them natively into Telugu, Hindi, and English, we empower smallholder farmers to diagnose visual crop blights within seconds, monitor weather indicators, and track every rupee spent.
            </p>
          </motion.div>

          {/* Right panel: Mission and Vision cards */}
          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            className="split-vision-column flex-column"
          >
            <motion.div variants={slideUp} className="mv-card glass-card flex-column">
              <div className="mv-header flex-center">
                <span className="mv-icon">🎯</span>
                <h3>Our Mission</h3>
              </div>
              <p>Empower smallholder farmers with hyper-local, farm-specific intelligence. By combining vision diagnostics and climate overlays, we aim to increase crop productivity, eliminate fertilizer waste, and secure rural financial stability.</p>
            </motion.div>

            <motion.div variants={slideUp} className="mv-card glass-card flex-column">
              <div className="mv-header flex-center">
                <span className="mv-icon">🌍</span>
                <h3>Our Vision</h3>
              </div>
              <p>To become India's most trusted digital agriculture infrastructure. We envision an integrated farming ecosystem where GPS boundaries, computer vision diagnostics, and cash ledger analysis are standard practices on every smartphone.</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Executive Spotlight Card */}
        <motion.section 
          variants={scaleIn} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="executive-spotlight flex-center"
        >
          <div className="exec-profile-card glass-card flex-between">
            <div className="exec-avatar-container">
              <img 
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256" 
                alt="Founder Abhiram Pulkam" 
                className="exec-avatar-img"
              />
            </div>
            <div className="exec-details flex-column">
              <span className="exec-label-txt">Founder & Developer</span>
              <h2>Abhiram Pulkam</h2>
              <span className="exec-loc-txt">📍 Karimnagar, Telangana, India</span>
              <div className="exec-divider" />
              <p className="exec-quote">
                "KisanAI was built to solve real problems for farmers in Telangana. We make advanced agricultural AI accessible in Telugu, Hindi, and English to help farmers make data-driven decisions."
              </p>
            </div>
          </div>
        </motion.section>
      </div>

      <style>{`
        .about-premium-root {
          background-color: var(--bg-secondary);
          min-height: 100vh;
          width: 100%;
          padding: 3rem 2rem 5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .about-premium-container {
          max-width: 1200px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
          position: relative;
          z-index: 10;
        }

        /* Hero styling */
        .about-hero {
          margin-bottom: 0.5rem;
        }

        .hero-heading {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin-top: 0.5rem;
        }

        .hero-subheading {
          color: var(--text-secondary);
          font-size: 1.15rem;
          max-width: 750px;
          margin: 0.75rem auto 0 auto;
          line-height: 1.6;
        }

        /* Glowing backdrops */
        .glow-circle {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: var(--radius-full);
          background-image: radial-gradient(rgba(34, 197, 94, 0.12), transparent 70%);
          filter: blur(40px);
          z-index: 1;
          pointer-events: none;
        }

        .glow-circle-1 {
          top: 10%;
          left: -100px;
        }

        .glow-circle-2 {
          bottom: 10%;
          right: -100px;
        }

        /* Metrics Row */
        .metrics-tour-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          width: 100%;
        }

        .metric-tour-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          gap: 1.25rem;
          justify-content: flex-start;
          transition: transform var(--transition-fast);
        }

        .metric-tour-card:hover {
          transform: translateY(-1px);
        }

        .metric-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background-color: var(--color-light-green);
          color: var(--color-primary);
          flex-shrink: 0;
        }

        html[data-theme='dark'] .metric-icon-circle {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .metric-tour-txt {
          align-items: flex-start;
          gap: 0.15rem;
        }

        .metric-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-val {
          font-size: 1.35rem;
          font-weight: 800;
          line-height: 1.1;
          font-family: var(--font-heading);
        }

        /* Splits layout */
        .about-split-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 2rem;
          width: 100%;
        }

        .split-story-card {
          background-color: var(--bg-primary);
          padding: 2.5rem;
          gap: 1.25rem;
          align-items: flex-start;
          justify-content: center;
        }

        .split-story-card h2 {
          font-size: 1.6rem;
          font-weight: 800;
        }

        .split-story-card p {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .section-header {
          gap: 0.75rem;
          justify-content: flex-start;
        }

        .header-emoji {
          font-size: 1.6rem;
        }

        .split-vision-column {
          gap: 1.5rem;
        }

        .mv-card {
          background-color: var(--bg-primary);
          padding: 2rem;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .mv-header {
          gap: 0.5rem;
          justify-content: flex-start;
        }

        .mv-icon {
          font-size: 1.4rem;
        }

        .mv-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .mv-card p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Executive Spotlight */
        .executive-spotlight {
          width: 100%;
        }

        .exec-profile-card {
          background-color: var(--bg-primary);
          padding: 2.5rem;
          width: 100%;
          gap: 2.5rem;
          align-items: center;
          border: 1.5px solid var(--border-color);
        }

        .exec-avatar-container {
          flex-shrink: 0;
        }

        .exec-avatar-img {
          width: 130px;
          height: 130px;
          border-radius: var(--radius-full);
          object-fit: cover;
          border: 4px solid var(--color-primary);
          box-shadow: var(--shadow-lg);
        }

        .exec-details {
          align-items: flex-start;
          flex-grow: 1;
          gap: 0.25rem;
        }

        .exec-label-txt {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .exec-details h2 {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .exec-loc-txt {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .exec-divider {
          width: 50px;
          height: 3px;
          background-color: var(--color-primary);
          margin: 0.5rem 0;
          border-radius: var(--radius-full);
        }

        .exec-quote {
          font-size: 0.95rem;
          font-style: italic;
          color: var(--text-secondary);
          line-height: 1.55;
        }

        /* Product Roadmap */
        .roadmap-tour-card {
          background-color: var(--bg-primary);
          padding: 3rem;
        }

        .roadmap-tour-card h2 {
          font-size: 1.6rem;
          font-weight: 800;
        }

        .roadmap-tour-timeline {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: relative;
          padding-left: 2rem;
        }

        .roadmap-tour-timeline::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 38px;
          bottom: 15px;
          width: 2px;
          background-color: var(--border-color);
        }

        .roadmap-tour-item {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          position: relative;
        }

        .roadmap-tour-badge {
          width: 76px;
          height: 30px;
          background-color: var(--color-light-green);
          color: var(--color-primary);
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          z-index: 5;
        }

        html[data-theme='dark'] .roadmap-tour-badge {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .roadmap-tour-text {
          align-items: flex-start;
          gap: 0.25rem;
        }

        .roadmap-tour-text h3 {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .roadmap-tour-text p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.55;
          text-align: left;
        }

        .green-text {
          color: var(--color-primary);
        }

        @media (max-width: 992px) {
          .about-split-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .exec-profile-card {
            flex-direction: column;
            text-align: center;
            padding: 2rem;
            gap: 1.5rem;
          }
          .exec-details {
            align-items: center;
          }
        }

        @media (max-width: 768px) {
          .metrics-tour-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .roadmap-tour-timeline::before {
            left: 38px;
          }
        }

        @media (max-width: 576px) {
          .about-premium-root {
            padding: 3rem 1rem 4rem 1rem;
          }
          .hero-heading {
            font-size: 2rem;
          }
          .roadmap-tour-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { Users, Globe, Award, ShieldCheck, Heart } from 'lucide-react';

export const CommunityPreview: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate('/login');
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
    <div className="comm-preview-container">
      {/* Background glowing decorations */}
      <div className="glow-circle glow-circle-1" />
      <div className="glow-circle glow-circle-2" />

      <div className="comm-inner flex-column">
        {/* Title */}
        <motion.div 
          variants={slideDown} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          className="comm-title-header text-center"
        >
          <span className="section-badge">👥 Community Hub</span>
          <h1>Connect Farmers Across the Globe</h1>
          <p>Discuss leaf diagnostics, seed varieties, organic pesticide recipes, and local crop pricing with progressive crop managers and agricultural advisors.</p>
        </motion.div>

        {/* Connection Graphic & Stats split */}
        <div className="comm-visual-grid">
          {/* Left panel: World Connections Map Visual */}
          <motion.div 
            variants={scaleIn} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            className="world-map-visual glass-card flex-center relative"
          >
            <div className="map-dots-backdrop"></div>
            
            {/* Pulsing connections pins */}
            <div className="map-pulse-pin pin-1"><div className="pulse-ring"></div></div>
            <div className="map-pulse-pin pin-2"><div className="pulse-ring"></div></div>
            <div className="map-pulse-pin pin-3"><div className="pulse-ring"></div></div>
            <div className="map-pulse-pin pin-4"><div className="pulse-ring"></div></div>

            <div className="connection-overlay-card glass-card flex-column text-center">
              <span className="live-count-badge">● 1,482 Farmers Online</span>
              <h4>Sharing Knowledge in Real Time</h4>
              <p>Discuss crop blight solutions, fertilizer dosage metrics, and irrigation conservation practices right now.</p>
            </div>
          </motion.div>

          {/* Right panel: Core network metrics */}
          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-50px" }} 
            className="community-pitch-col flex-column"
          >
            <motion.div variants={slideUp} className="pitch-feature glass-card flex-center">
              <div className="pitch-icon flex-center"><Globe size={20} /></div>
              <div>
                <h4>Global Expert Panel</h4>
                <p>Consult with certified soil consultants, crop health researchers, and veteran agronomists globally.</p>
              </div>
            </motion.div>

            <motion.div variants={slideUp} className="pitch-feature glass-card flex-center">
              <div className="pitch-icon flex-center"><Users size={20} /></div>
              <div>
                <h4>Peer-to-Peer Query Boards</h4>
                <p>Post photos of leaf issues and receive rapid suggestions from farmers who solved the same troubles.</p>
              </div>
            </motion.div>

            <motion.div variants={slideUp} className="pitch-feature glass-card flex-center">
              <div className="pitch-icon flex-center"><Award size={20} /></div>
              <div>
                <h4>Certified Success Stories</h4>
                <p>Read vetted reports of cotton yield increases and cost-saving irrigation schedules.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Lock Wall Card */}
        <motion.div 
          variants={scaleIn} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="community-lock-card glass-card text-center flex-column flex-center"
        >
          <div className="lock-icon-circle flex-center">👥</div>
          <h2>Join the KisanAI Network</h2>
          <p>Unlock verified expert consulting, regional discussions feeds, and nearby cultivator maps. Join over 12,000+ progressive managers today.</p>
          <button className="btn btn-primary btn-lg flex-center" onClick={handleJoin}>
            <span>Join Community / Register Account</span>
          </button>
        </motion.div>
      </div>

      <style>{`
        .comm-preview-container {
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

        .comm-inner {
          max-width: 1200px;
          width: 100%;
          gap: 3.5rem;
          position: relative;
          z-index: 10;
        }

        .comm-title-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .comm-title-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          max-width: 650px;
          margin: 0.5rem auto 0 auto;
          line-height: 1.5;
        }

        /* Glowing backdrops */
        .glow-circle {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: var(--radius-full);
          background-image: radial-gradient(rgba(34, 197, 94, 0.1), transparent 70%);
          filter: blur(45px);
          z-index: 1;
          pointer-events: none;
        }

        .glow-circle-1 {
          top: 15%;
          left: -120px;
        }

        .glow-circle-2 {
          bottom: 15%;
          right: -120px;
        }

        /* Map visual split */
        .comm-visual-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 2rem;
          align-items: center;
        }

        .world-map-visual {
          height: 350px;
          background-color: #0F172A;
          border-radius: var(--radius-lg);
          overflow: hidden;
          position: relative;
        }

        html[data-theme='light'] .world-map-visual {
          background-color: #f1f5f9;
          border: 1px solid var(--border-color);
        }

        .map-dots-backdrop {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0.15;
          background-image: radial-gradient(circle, #94a3b8 1px, transparent 1px);
          background-size: 20px 20px;
        }

        html[data-theme='light'] .map-dots-backdrop {
          opacity: 0.45;
          background-image: radial-gradient(circle, #475569 1px, transparent 1px);
        }

        /* Pulsing Pin */
        .map-pulse-pin {
          position: absolute;
          width: 8px;
          height: 8px;
          background-color: var(--color-primary);
          border-radius: 50%;
        }

        .pulse-ring {
          position: absolute;
          top: -16px;
          left: -16px;
          width: 40px;
          height: 40px;
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          opacity: 0;
          animation: pulseAnim 2s infinite ease-out;
        }

        @keyframes pulseAnim {
          0% { transform: scale(0.2); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        .pin-1 { top: 30%; left: 40%; }
        .pin-2 { top: 60%; left: 75%; }
        .pin-3 { top: 75%; left: 55%; }
        .pin-4 { top: 40%; left: 20%; }

        .connection-overlay-card {
          background-color: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 1.5rem;
          max-width: 300px;
          gap: 0.5rem;
          z-index: 10;
        }

        html[data-theme='light'] .connection-overlay-card {
          background-color: rgba(255, 255, 255, 0.9);
          border-color: var(--border-color);
          color: var(--text-primary);
        }

        .live-count-badge {
          background-color: rgba(34, 197, 94, 0.15);
          color: var(--color-primary);
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .connection-overlay-card h4 {
          font-size: 1rem;
          font-weight: 800;
        }

        .connection-overlay-card p {
          font-size: 0.75rem;
          color: #94a3b8;
          line-height: 1.4;
        }

        html[data-theme='light'] .connection-overlay-card p {
          color: var(--text-secondary);
        }

        /* Pitch features */
        .community-pitch-col {
          gap: 1.25rem;
        }

        .pitch-feature {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          gap: 1.25rem;
          justify-content: flex-start;
          text-align: left;
        }

        .pitch-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background-color: var(--color-light-green);
          color: var(--color-primary);
          flex-shrink: 0;
        }

        html[data-theme='dark'] .pitch-icon {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .pitch-feature h4 {
          font-size: 1.05rem;
          font-weight: 800;
          margin-bottom: 0.15rem;
        }

        .pitch-feature p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Lock Wall */
        .community-lock-card {
          background-color: var(--bg-primary);
          padding: 3.5rem;
          gap: 1.25rem;
          border: 1.5px solid var(--color-primary);
          border-radius: var(--radius-lg);
        }

        .lock-icon-circle {
          width: 55px;
          height: 55px;
          font-size: 1.75rem;
          background-color: var(--bg-secondary);
          border-radius: 50%;
        }

        .community-lock-card h2 {
          font-size: 1.85rem;
          font-weight: 800;
        }

        .community-lock-card p {
          font-size: 1.05rem;
          color: var(--text-secondary);
          max-width: 600px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .comm-visual-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        @media (max-width: 576px) {
          .comm-preview-container {
            padding: 3rem 1rem 4rem 1rem;
          }
          .comm-title-header h1 {
            font-size: 2rem;
          }
          .community-lock-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

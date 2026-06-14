import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Language } from '../../context/LanguageContext';
import { useFarms } from '../../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Volume2, CloudRain, BellRing, Trophy, Languages } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Onboarding: React.FC = () => {
  const { completeOnboarding, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { addFarm } = useFarms();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  
  // Farm input state
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('Cotton');
  const [area, setArea] = useState<number>(3);
  const [soilType, setSoilType] = useState('Loam Soil');
  const [irrigation, setIrrigation] = useState('Drip Irrigation');

  // Notifications state
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);
  const [schemeAlerts, setSchemeAlerts] = useState(true);

  const nextStep = () => {
    if (step === 3) {
      // Trigger confetti on success step!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = () => {
    // Complete onboarding milestone
    completeOnboarding({
      language,
      alerts: {
        weather: weatherAlerts,
        disease: diseaseAlerts,
        schemes: schemeAlerts
      }
    });

    navigate('/dashboard');
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="onboard-wrapper flex-center">
      <div className="onboard-box glass-card">
        {/* Step Indicator */}
        <div className="onboard-progress-bar">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`progress-step-circle flex-center ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
            >
              {step > s ? <Check size={12} /> : s}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="onboard-step-content text-center"
            >
              <span className="onboard-step-badge">Step 1 of 4</span>
              <h1>Welcome to KisanAI</h1>
              <h2 className="onboard-subtitle">Let's Set Up Your First Farm</h2>
              <div className="onboard-illustration">🌱</div>
              <p className="onboard-description">KisanAI is your intelligent digital farming assistant. We will help you track weather forecasts, log cashflow, monitor crop health, and consult farming experts.</p>
              <button className="btn btn-primary" onClick={nextStep}>Let's Begin</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="onboard-step-content"
            >
              <span className="onboard-step-badge">Step 2 of 4</span>
              <h2>Choose Language</h2>
              <p className="onboard-description text-muted">Select your primary language for the platform interface and AI assistance.</p>
              
              <div className="language-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', margin: '1rem 0' }}>
                {[
                  { code: 'en', label: 'English', sub: 'English' },
                  { code: 'te', label: 'తెలుగు', sub: 'Telugu' },
                  { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
                  { code: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
                  { code: 'mr', label: 'मराठी', sub: 'Marathi' },
                  { code: 'ta', label: 'தமிழ்', sub: 'Tamil' },
                  { code: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
                  { code: 'bn', label: 'বাংলা', sub: 'Bengali' },
                  { code: 'pa', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
                  { code: 'ml', label: 'മലയാളം', sub: 'Malayalam' }
                ].map((lang) => (
                  <button 
                    type="button"
                    key={lang.code}
                    className={`lang-option-card ${language === lang.code ? 'active' : ''}`}
                    onClick={() => setLanguage(lang.code as any)}
                    style={{ padding: '0.75rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <span className="lang-name" style={{ fontSize: '0.95rem' }}>{lang.label}</span>
                    <span className="lang-sub" style={{ fontSize: '0.7rem' }}>{lang.sub}</span>
                  </button>
                ))}
              </div>

              <div className="onboard-buttons flex-between">
                <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                <button className="btn btn-primary" onClick={nextStep}>Next Step</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="onboard-step-content"
            >
              <span className="onboard-step-badge">Step 3 of 4</span>
              <h2>Enable Notifications</h2>
              <p className="onboard-description text-muted">Stay updated with instant text message alerts directly to your phone.</p>

              <div className="notifications-toggle-list">
                <div className="toggle-item flex-between">
                  <div className="toggle-text">
                    <h3>Weather Alerts</h3>
                    <p>Alerts about sudden rainfall, temperature spikes, or storms.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle-checkbox" 
                    checked={weatherAlerts} 
                    onChange={(e) => setWeatherAlerts(e.target.checked)}
                  />
                </div>

                <div className="toggle-item flex-between">
                  <div className="toggle-text">
                    <h3>Disease Alerts</h3>
                    <p>Fungal infection risks and outbreaks in Karimnagar zone.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle-checkbox" 
                    checked={diseaseAlerts} 
                    onChange={(e) => setDiseaseAlerts(e.target.checked)}
                  />
                </div>

                <div className="toggle-item flex-between">
                  <div className="toggle-text">
                    <h3>Government Scheme Alerts</h3>
                    <p>Release alerts for PM-KISAN instalments and Rythu Bandhu claims.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle-checkbox" 
                    checked={schemeAlerts} 
                    onChange={(e) => setSchemeAlerts(e.target.checked)}
                  />
                </div>
              </div>

              <div className="onboard-buttons flex-between">
                <button className="btn btn-secondary" onClick={prevStep}>Back</button>
                <button className="btn btn-primary" onClick={nextStep}>Complete Setup</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="onboard-step-content text-center"
            >
              <span className="onboard-step-badge">Step 4 of 4</span>
              <h2>Dashboard Ready</h2>
              <div className="onboard-success-trophy"><Trophy size={48} className="trophy-icon" /></div>
              <h1 className="text-gradient">Welcome to KisanAI!</h1>
              <p className="onboard-description">Your profile setup is complete. You can now access crop disease scanning, hyper-local weather forecasting, cashbook accounting, and farmer group feeds.</p>
              
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleFinish}>
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .onboard-wrapper {
          min-height: 100vh;
          width: 100vw;
          padding: 2rem;
          background-color: var(--bg-secondary);
        }

        .onboard-box {
          background-color: var(--bg-primary);
          width: 100%;
          max-width: 500px;
          min-height: 520px;
          display: flex;
          flex-direction: column;
          padding: 2.5rem;
          position: relative;
        }

        .onboard-progress-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          position: relative;
        }

        .onboard-progress-bar::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--border-color);
          transform: translateY(-50%);
          z-index: 1;
        }

        .progress-step-circle {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background-color: var(--bg-secondary);
          border: 2px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          position: relative;
          z-index: 2;
          transition: all var(--transition-fast);
        }

        .progress-step-circle.active {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background-color: var(--bg-primary);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
        }

        .progress-step-circle.completed {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
        }

        .onboard-step-badge {
          font-size: 0.75rem;
          color: var(--color-primary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .onboard-step-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex-grow: 1;
        }

        .onboard-subtitle {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .onboard-illustration {
          font-size: 4rem;
          margin: 1rem 0;
        }

        .onboard-description {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .onboard-buttons {
          margin-top: auto;
          padding-top: 2rem;
        }

        /* Language step card layout */
        .language-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1rem 0;
        }

        .lang-option-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 2px solid var(--border-color);
          background-color: var(--bg-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-primary);
          font-family: var(--font-heading);
        }

        .lang-option-card:hover {
          border-color: var(--text-muted);
        }

        .lang-option-card.active {
          border-color: var(--color-primary);
          background-color: var(--color-light-green);
        }

        html[data-theme='dark'] .lang-option-card.active {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .lang-name {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .lang-sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        /* Notifications Toggle list style */
        .notifications-toggle-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin: 1rem 0;
        }

        .toggle-item {
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .toggle-text h3 {
          font-size: 1rem;
          font-weight: 700;
        }

        .toggle-text p {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .toggle-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--color-primary);
        }

        /* Step 5 trophy styling */
        .onboard-success-trophy {
          margin: 1rem 0;
        }

        .trophy-icon {
          color: var(--color-warning);
          filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.4));
        }

        .flex-1 {
          flex: 1;
        }

        @media (max-width: 640px) {
          .onboard-box {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

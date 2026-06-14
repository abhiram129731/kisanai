import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  CloudSun, 
  Camera, 
  Wallet, 
  Users, 
  Bot, 
  BookOpen,
  ArrowRight,
  ChevronDown,
  Search,
  Bell
} from 'lucide-react';

export const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleStart = () => {
    if (user) {
      navigate(user.isOnboarded ? '/dashboard' : '/onboarding');
    } else {
      navigate('/login');
    }
  };

  const slideDown = {
    hidden: { opacity: 0, y: -45 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } }
  };
  const slideUp = {
    hidden: { opacity: 0, y: 45 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } }
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.0, ease: 'easeOut' as const } }
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
  const cardSlideUp = {
    hidden: { opacity: 0, y: 35 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: 'easeOut' as const } 
    }
  };
  const scaleIn = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' as const }
    }
  };

  const statItems = [
    { label: 'Happy Farmers', value: '10,000+' },
    { label: 'Acres Managed', value: '50,000+' },
    { label: 'Average Yield Increase', value: '25%+' },
    { label: 'Potential Profit Impact', value: '₹100Cr+' }
  ];

  const featuresList = [
    { 
      icon: Camera, 
      title: 'AI Disease Detection', 
      desc: 'Detect diseases early and get treatment recommendations.' 
    },
    { 
      icon: CloudSun, 
      title: 'Weather Intelligence', 
      desc: 'Farm-specific weather forecasts & smart alerts.' 
    },
    { 
      icon: Wallet, 
      title: 'Cashbook & Analytics', 
      desc: 'Track income, expenses & analyze profits instantly.' 
    },
    { 
      icon: Bot, 
      title: 'AI Farm Copilot', 
      desc: 'Ask anything about farming in your language.' 
    },
    { 
      icon: Users, 
      title: 'Farmer Community', 
      desc: 'Connect, learn & grow with farmers and experts.' 
    },
    { 
      icon: BookOpen, 
      title: 'Government Schemes', 
      desc: 'Find schemes, check eligibility & apply easily.' 
    }
  ];

  const testimonials = [
    {
      name: 'Ramesh Mandula',
      location: 'Karimnagar, Telangana',
      crop: 'Cotton & Paddy Farmer',
      text: 'KisanAI cashbook has saved me over ₹15,000 in fertilizer costs by pointing out category overspends. The disease scanner is extremely fast!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=128'
    },
    {
      name: 'Lakshmi Narayana',
      location: 'Warangal, Telangana',
      crop: 'Paddy Farmer',
      text: 'Weather warnings for heavy rain allowed me to push back pesticide application by 3 days, saving me ₹8,000 from rain leaching.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=128'
    }
  ];

  const faqs = [
    {
      q: 'Is KisanAI free?',
      a: 'Yes, the core KisanAI platform, including hyper-local weather alerts, cashbook entries, crop disease diagnosis, and access to basic community guides is 100% free for Indian farmers.'
    },
    {
      q: 'Which languages are supported?',
      a: 'We support English, Telugu (తెలుగు), and Hindi (हिन्दी) natively across the entire platform, including text-to-speech outputs in the AI Farm Copilot.'
    },
    {
      q: 'Can I manage multiple farms?',
      a: 'Absolutely. You can add, label, draw satellite GPS coordinates, and maintain transaction logs for separate farm plots within the same user profile.'
    },
    {
      q: 'How accurate is disease detection?',
      a: 'Our computer vision engine is trained on hundreds of thousands of visual leaf patterns and yields a 96% diagnostic confidence for regional crops like Cotton, Paddy, and Maize.'
    },
    {
      q: 'Is weather farm-specific?',
      a: 'Yes, rather than using broad district averages, KisanAI maps your exact drawn GPS boundary coordinates to compute custom evapotranspiration levels and rainfall indexes.'
    }
  ];

  return (
    <div className="home-page-root">
      {/* Hero Section */}
      <section className="hero-landing-wrap">
        <div className="hero-inner-container">
          <motion.div variants={slideDown} initial="hidden" whileInView="visible" viewport={{ once: true }} className="hero-text-side">
            <div className="hero-badge-item flex-center">
              <span className="badge-bullet"></span>
              <span>AI-Powered Digital Farming Operating System</span>
            </div>
            
            <h1 className="hero-main-title">
              AI That Understands <br />
              <span className="green-text-highlight">Your Farm.</span>
            </h1>

            <p className="hero-description-para">
              Manage multiple farms, detect crop diseases, monitor weather, track profits, get AI recommendations, and connect with farmers – all in one intelligent platform.
            </p>

            <div className="hero-cta-buttons flex-center">
              <button className="btn btn-primary btn-lg flex-center" onClick={handleStart}>
                <span>Start Farming Smarter</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="hero-graphics-side relative">
            {/* Desktop Mockup Card */}
            <div className="mockup-browser-shell">
              <div className="browser-shell-header flex-between">
                <div className="browser-dots flex-center">
                  <span className="b-dot dot-red"></span>
                  <span className="b-dot dot-yellow"></span>
                  <span className="b-dot dot-green"></span>
                </div>
                <div className="browser-address">app.kisanai.in</div>
              </div>

              <div className="mockup-browser-body">
                {/* Mockup Sidebar */}
                <div className="mockup-side-menu flex-column">
                  <div className="mockup-brand">🌾 KisanAI</div>
                  <div className="mockup-menu-item active">📊 Dashboard</div>
                  <div className="mockup-menu-item">🌱 My Farms</div>
                  <div className="mockup-menu-item">☀️ Weather</div>
                  <div className="mockup-menu-item">🤖 AI Copilot</div>
                  <div className="mockup-menu-item">📸 Disease Scan</div>
                  <div className="mockup-menu-item">📒 Cashbook</div>
                  <div className="mockup-menu-item">📈 Analytics</div>
                </div>

                {/* Mockup Content */}
                <div className="mockup-panel flex-column">
                  <div className="mockup-header-bar flex-between">
                    <div className="mockup-search flex-center">
                      <Search size={12} />
                      <span>Search anything...</span>
                    </div>
                    <div className="mockup-icons flex-center">
                      <Bell size={14} className="relative" />
                      <div className="mockup-user-avatar">RP</div>
                    </div>
                  </div>

                  <div className="mockup-dashboard-top">
                    <h4>Good Morning, Ramesh 👋</h4>
                    <p>Here's what's happening in your farms today.</p>
                  </div>

                  <div className="mockup-stats-row">
                    <div className="mockup-stat-box">
                      <span className="box-lbl">Total Farms</span>
                      <span className="box-val">4</span>
                      <span className="box-sub">Active</span>
                    </div>
                    <div className="mockup-stat-box">
                      <span className="box-lbl">Weather Alerts</span>
                      <span className="box-val red-text">2</span>
                      <span className="box-sub">Active</span>
                    </div>
                    <div className="mockup-stat-box">
                      <span className="box-lbl">Estimated Profit</span>
                      <span className="box-val green-text">₹42,500</span>
                      <span className="box-sub">+18.6%</span>
                    </div>
                  </div>

                  <div className="mockup-bottom-widgets">
                    <div className="widget-card weather-w">
                      <h5>Weather Overview</h5>
                      <div className="weather-row flex-between">
                        <span>Karimnagar</span>
                        <span className="w-metric">34°C ☀️ 15%</span>
                      </div>
                      <div className="weather-row flex-between warning">
                        <span>Warangal</span>
                        <span className="w-metric">28°C 🌧️ 87%</span>
                      </div>
                    </div>

                    <div className="widget-card profit-w">
                      <h5>Profit Overview</h5>
                      <div className="p-totals flex-between">
                        <div>
                          <span className="w-sub-lbl">Total In</span>
                          <span className="w-sub-val success">₹85,200</span>
                        </div>
                        <div>
                          <span className="w-sub-lbl">Total Out</span>
                          <span className="w-sub-val danger">₹42,700</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Mockup Overlapping */}
            <div className="mockup-phone-shell">
              <div className="phone-notch"></div>
              <div className="phone-screen-content">
                <div className="phone-header flex-center">📸 Disease Diagnosis</div>
                <div className="phone-leaf-img"></div>
                <div className="phone-diagnosis-details">
                  <div className="phone-lbl">Diagnosis Result</div>
                  <div className="phone-val">Leaf Blight</div>
                  <div className="phone-conf success">Confidence: 96%</div>
                  <div className="phone-treatment">
                    <strong>Treatment:</strong> Copper based fungicide spray recommended.
                  </div>
                  <button className="phone-cta flex-center">View Details</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Row Strip */}
        <motion.div 
          variants={scaleIn} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          className="hero-stats-strip"
        >
          <div className="stats-inner flex-between">
            {statItems.map((stat, idx) => (
              <div key={idx} className="stat-strip-box">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Everything You Need Section */}
      <motion.section 
        variants={fadeIn} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        className="features-showcase-section"
      >
        <div className="showcase-header text-center">
          <span className="section-dot-indicator flex-center"></span>
          <h2 className="section-main-title">Everything You Need to Grow Better</h2>
          <p className="section-desc-subtitle">Modern agricultural operating technology tailored for Indian crop management and high-yield farming.</p>
        </div>

        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="features-cards-grid"
        >
          {featuresList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div key={idx} variants={cardSlideUp} className="feature-show-card glass-card">
                <div className="feat-icon-circle flex-center">
                  <Icon size={24} />
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Accordion FAQ Section */}
      <motion.section 
        variants={slideUp} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        className="faq-accordions-section"
      >
        <div className="showcase-header text-center">
          <h2 className="section-main-title">Frequently Asked Questions</h2>
          <p className="section-desc-subtitle">Find answers to common questions about KisanAI's agricultural operating system.</p>
        </div>

        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="faq-accordions-container"
        >
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx} 
              variants={cardSlideUp}
              className={`faq-item-card ${activeFaq === idx ? 'expanded' : ''}`}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="faq-card-header flex-between">
                <h3>{faq.q}</h3>
                <ChevronDown size={20} className="accordion-chevron" />
              </div>
              <div className="faq-card-body">
                <p>{faq.a}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Testimonials section */}
      <motion.section 
        variants={slideUp} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        className="testimonials-landing-section"
      >
        <div className="showcase-header text-center">
          <h2 className="section-main-title">Trusted By Progressive Farmers</h2>
          <p className="section-desc-subtitle">Hear how modern digital cashbooks and AI alerts protect farm profits and crop health.</p>
        </div>

        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="testimonials-cards-row"
        >
          {testimonials.map((t, idx) => (
            <motion.div key={idx} variants={cardSlideUp} className="t-card glass-card">
              <div className="t-card-header flex-center" style={{ gap: '1rem', justifyContent: 'flex-start' }}>
                <img src={t.avatar} alt={t.name} className="t-avatar" />
                <div>
                  <h4>{t.name}</h4>
                  <p>{t.crop} • {t.location}</p>
                </div>
              </div>
              <p className="t-card-text">"{t.text}"</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <style>{`
        .home-page-root {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--bg-secondary);
        }

        /* Hero Section Styling */
        .hero-landing-wrap {
          width: 100%;
          background: radial-gradient(circle at 10% 20%, rgba(220, 252, 231, 0.4) 0%, rgba(255, 255, 255, 0.3) 90%);
          padding: 5rem 2rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        html[data-theme='dark'] .hero-landing-wrap {
          background: radial-gradient(circle at 10% 20%, rgba(22, 163, 74, 0.08) 0%, rgba(15, 23, 42, 0.2) 90%);
        }

        .hero-inner-container {
          max-width: 1280px;
          width: 100%;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-text-side {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .hero-badge-item {
          background-color: rgba(22, 163, 74, 0.1);
          color: var(--color-primary);
          padding: 0.4rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          gap: 0.5rem;
        }

        .badge-bullet {
          width: 6px;
          height: 6px;
          background-color: var(--color-primary);
          border-radius: 50%;
        }

        .hero-main-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .green-text-highlight {
          color: var(--color-primary);
        }

        .hero-description-para {
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 540px;
        }

        .hero-cta-buttons {
          gap: 1rem;
          justify-content: flex-start;
        }

        .hero-cta-buttons .btn {
          font-size: 0.95rem;
          padding: 0.8rem 1.8rem;
        }


        /* Hero Graphics Side */
        .hero-graphics-side {
          width: 100%;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Browser Mockup Shell */
        .mockup-browser-shell {
          width: 90%;
          height: 380px;
          background-color: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        html[data-theme='dark'] .mockup-browser-shell {
          background-color: #1E293B;
          border-color: #334155;
        }

        .browser-shell-header {
          background-color: var(--bg-secondary);
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.7rem;
        }

        .browser-dots {
          gap: 0.4rem;
        }

        .b-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-red { background-color: #EF4444; }
        .dot-yellow { background-color: #F59E0B; }
        .dot-green { background-color: #10B981; }

        .browser-address {
          color: var(--text-muted);
          font-weight: 600;
        }

        .mockup-browser-body {
          flex-grow: 1;
          display: flex;
          height: 100%;
        }

        /* Mockup Sidebar */
        .mockup-side-menu {
          width: 110px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          padding: 0.75rem 0.5rem;
          gap: 0.25rem;
        }

        .mockup-brand {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }

        .mockup-menu-item {
          font-size: 0.55rem;
          font-weight: 700;
          padding: 0.3rem 0.5rem;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          text-align: left;
          width: 100%;
        }

        .mockup-menu-item.active {
          background-color: var(--color-light-green);
          color: var(--color-primary);
        }

        html[data-theme='dark'] .mockup-menu-item.active {
          background-color: rgba(22, 163, 74, 0.15);
        }

        /* Mockup Main panel */
        .mockup-panel {
          flex-grow: 1;
          padding: 1rem;
          gap: 0.75rem;
        }

        .mockup-header-bar {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.4rem;
        }

        .mockup-search {
          font-size: 0.55rem;
          color: var(--text-muted);
          gap: 0.25rem;
        }

        .mockup-icons {
          gap: 0.5rem;
        }

        .mockup-user-avatar {
          width: 16px;
          height: 16px;
          background-color: var(--color-primary);
          color: #FFFFFF;
          border-radius: 50%;
          font-size: 0.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mockup-dashboard-top h4 {
          font-size: 0.85rem;
          font-weight: 800;
        }

        .mockup-dashboard-top p {
          font-size: 0.55rem;
          color: var(--text-muted);
        }

        .mockup-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .mockup-stat-box {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
        }

        .box-lbl {
          font-size: 0.5rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .box-val {
          font-size: 0.8rem;
          font-weight: 800;
          font-family: var(--font-heading);
        }

        .box-sub {
          font-size: 0.45rem;
          color: var(--text-muted);
        }

        .red-text { color: var(--color-danger); }
        .green-text { color: var(--color-primary); }

        .mockup-bottom-widgets {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 0.5rem;
        }

        .widget-card {
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .widget-card h5 {
          font-size: 0.6rem;
          font-weight: 800;
          margin-bottom: 0.1rem;
        }

        .weather-row {
          font-size: 0.5rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.15rem;
        }

        .weather-row:last-child {
          border-bottom: none;
        }

        .weather-row.warning {
          color: var(--color-danger);
        }

        .w-sub-lbl {
          font-size: 0.45rem;
          color: var(--text-muted);
          display: block;
        }

        .w-sub-val {
          font-size: 0.6rem;
          font-weight: 700;
        }

        .success { color: var(--color-success); }
        .danger { color: var(--color-danger); }

        /* Phone mockup shell overlapping */
        .mockup-phone-shell {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 170px;
          height: 310px;
          background-color: #000000;
          border-radius: 24px;
          box-shadow: var(--shadow-xl);
          border: 4px solid #1E293B;
          padding: 0.4rem;
          overflow: hidden;
          z-index: 50;
        }

        .phone-notch {
          width: 80px;
          height: 12px;
          background-color: #000000;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          z-index: 60;
        }

        .phone-screen-content {
          background-color: #FFFFFF;
          height: 100%;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        html[data-theme='dark'] .phone-screen-content {
          background-color: #0F172A;
        }

        .phone-header {
          height: 25px;
          background-color: var(--color-primary);
          color: #FFFFFF;
          font-size: 0.55rem;
          font-weight: 700;
        }

        .phone-leaf-img {
          height: 100px;
          background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=256');
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .phone-leaf-img::after {
          content: '';
          position: absolute;
          top: 10px;
          left: 10px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #EF4444;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .phone-diagnosis-details {
          flex-grow: 1;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .phone-lbl {
          font-size: 0.45rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .phone-val {
          font-size: 0.8rem;
          font-weight: 800;
        }

        .phone-conf {
          font-size: 0.55rem;
          font-weight: 700;
        }

        .phone-treatment {
          font-size: 0.5rem;
          line-height: 1.3;
          color: var(--text-secondary);
        }

        .phone-cta {
          margin-top: auto;
          background-color: var(--color-primary);
          color: #FFFFFF;
          border: none;
          font-size: 0.55rem;
          font-weight: 700;
          padding: 0.35rem;
          border-radius: 6px;
          cursor: pointer;
        }

        /* Stats strip */
        .hero-stats-strip {
          max-width: 1100px;
          width: 100%;
          margin-top: 3.5rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-lg);
          padding: 1.5rem 3rem;
          z-index: 10;
        }

        .stats-inner {
          width: 100%;
          gap: 2rem;
        }

        .stat-strip-box {
          text-align: center;
          flex: 1;
          border-right: 1px solid var(--border-color);
        }

        .stat-strip-box:last-child {
          border-right: none;
        }

        .stat-strip-box h3 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-primary);
          font-family: var(--font-heading);
          line-height: 1;
        }

        .stat-strip-box p {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        /* Everything You Need Section */
        .features-showcase-section {
          max-width: 1100px;
          width: 100%;
          padding: 5rem 2rem;
        }

        .showcase-header {
          margin-bottom: 3.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .section-dot-indicator {
          width: 24px;
          height: 12px;
          position: relative;
        }

        .section-dot-indicator::after {
          content: '';
          width: 16px;
          height: 3px;
          background-color: var(--color-primary);
          border-radius: 2px;
        }

        .section-main-title {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .section-desc-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary);
          max-width: 580px;
          line-height: 1.5;
        }

        .features-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .feature-show-card {
          background-color: var(--bg-primary);
          padding: 2.25rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.25rem;
        }

        .feat-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background-color: var(--color-light-green);
          color: var(--color-primary);
        }

        html[data-theme='dark'] .feat-icon-circle {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .feature-show-card h3 {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .feature-show-card p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* FAQ Styling */
        .faq-accordions-section {
          max-width: 800px;
          width: 100%;
          padding: 2rem 2rem 5rem 2rem;
        }

        .faq-accordions-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .faq-item-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .faq-item-card:hover {
          border-color: var(--color-primary);
        }

        .faq-card-header {
          gap: 1.5rem;
        }

        .faq-card-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
        }

        .accordion-chevron {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
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
          max-height: 200px;
          margin-top: 1rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }

        .faq-card-body p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Testimonials Section */
        .testimonials-landing-section {
          max-width: 1100px;
          width: 100%;
          padding: 2rem 2rem 5rem 2rem;
        }

        .testimonials-cards-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          margin-top: 1rem;
        }

        .t-card {
          background-color: var(--bg-primary);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .t-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
        }

        .t-card-header h4 {
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .t-card-header p {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .t-card-text {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
          font-style: italic;
        }


        /* Responsive */
        @media (max-width: 1024px) {
          .hero-inner-container {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }
          .hero-cta-buttons {
            justify-content: center;
          }
          .hero-description-para {
            max-width: 100%;
          }
          .features-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero-landing-wrap {
            padding: 3rem 1rem 1rem 1rem;
          }
          .hero-main-title {
            font-size: 2.5rem;
          }
          .hero-stats-strip {
            padding: 1rem;
          }
          .stats-inner {
            flex-direction: column;
            gap: 1.5rem;
          }
          .stat-strip-box {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1rem;
          }
          .stat-strip-box:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .features-cards-grid {
            grid-template-columns: 1fr;
          }
          .testimonials-cards-row {
            grid-template-columns: 1fr;
          }

        }
      `}</style>
    </div>
  );
};

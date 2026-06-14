import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Camera, 
  CloudSun, 
  Sprout, 
  Bot, 
  Wallet, 
  TrendingUp, 
  Droplet, 
  BookOpen, 
  Users, 
  FileText,
  CheckCircle2
} from 'lucide-react';

interface FeatureItem {
  icon: any;
  title: string;
  tagline: string;
  description: string;
  benefits: string[];
}

export const Features: React.FC = () => {
  const { t } = useLanguage();

  const featuresList: FeatureItem[] = [
    {
      icon: Camera,
      title: 'AI Disease Detection',
      tagline: 'Computer Vision Leaf Tissue Analysis',
      description: 'Upload visual snaps of leaf surfaces to diagnose bacterial blights, leaf spots, and nutrient deficiencies with 96% accuracy, powered by Gemini AI.',
      benefits: [
        'Instant response times direct to field workers',
        'Visual indicators marking infected areas',
        'Organic treatment guides & pesticide suggestions'
      ]
    },
    {
      icon: CloudSun,
      title: 'Weather Intelligence',
      tagline: 'GPS Coordinate-Specific Forecasts',
      description: 'Request exact telemetry warnings for rainfall margins, severe storm cycles, and humidity spikes directly affecting your boundaries.',
      benefits: [
        'Alert feeds regarding heavy wind velocities',
        'Automated calendar recommendations for fertilizer feeds',
        'Soil evapotranspiration mapping'
      ]
    },
    {
      icon: Sprout,
      title: 'Multi-Farm Management',
      tagline: 'Satellite Coordinates Fence Boundary Planner',
      description: 'Map out boundary plots using satellite canvas drawer controls and calculate acreage parameters automatically.',
      benefits: [
        'Interactive GPS drawing layout boundary cards',
        'Separate log timelines for each plot',
        'Crop rotation records storage'
      ]
    },
    {
      icon: Bot,
      title: 'AI Farm Copilot',
      tagline: 'Multi-Language Speech Chatbot',
      description: 'Query crop diseases, fertilization intervals, and market pricing using voice messages or text notes in your preferred local language.',
      benefits: [
        'Real-time translation for Telugu and Hindi',
        'Speech synthesis answers read aloud',
        'Simulated agronomy advice database'
      ]
    },
    {
      icon: Wallet,
      title: 'Cashbook Ledger',
      tagline: 'Crop Margin and Cost Accounts Tracker',
      description: 'Log costs (fertilizer, tractor rentals, labour hours) and harvest revenues to evaluate farm-wise profitability.',
      benefits: [
        'Separate balance sums for active farm plots',
        'Categorized budget allocations charts',
        'Downloadable exportable ledger sheets'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Yield Prediction',
      tagline: 'Advanced Harvest Yield Estimator',
      description: 'Calculate crop yields in quintals based on acreage size, soil density parameters, and local forecast estimates.',
      benefits: [
        'Soil-specific calibration scores',
        'Comparison models with regional Karimnagar benchmarks',
        'Yield metrics tracking indicators'
      ]
    },
    {
      icon: Droplet,
      title: 'Irrigation Advisor',
      tagline: 'Smart Watering Schedule Optimizer',
      description: 'Compute exact watering intervals and water volumes based on soil profiles and temperature changes.',
      benefits: [
        'Reduces pumping diesel costs by up to 30%',
        'Waterlogging danger warnings',
        'Custom drip vs flood irrigation advices'
      ]
    },
    {
      icon: BookOpen,
      title: 'Government Schemes',
      tagline: 'PM-KISAN and Rythu Bandhu Tracking',
      description: 'Explore active central and state subsidies, check eligibility guidelines, and receive step-by-step application instructions.',
      benefits: [
        'State-wise custom filters (Telangana / Andhra Pradesh)',
        'Application deadline notifications',
        'Required document checklists'
      ]
    },
    {
      icon: Users,
      title: 'Farmer Community',
      tagline: 'Expert Networks and Discussion Panels',
      description: 'Discuss leaf spots, pesticide recipes, and success stories with progressive crop managers across Bharat.',
      benefits: [
        'Direct messaging with ANGRAU university experts',
        'Localized community question circles',
        'Yield record success feeds'
      ]
    },
    {
      icon: FileText,
      title: 'Agronomic Reports',
      tagline: 'PDF Profile Logs Generator',
      description: 'Compile detailed financial cashbooks, soil test values, and harvest schedules into printable PDF sheets.',
      benefits: [
        'Single-click download configurations',
        'Clean layouts optimized for bank credit audits',
        'Integrated timeline milestone lists'
      ]
    }
  ];

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
    <div className="features-tour-root">
      <div className="features-tour-container">
        {/* Page Title */}
        <motion.div 
          variants={slideDown} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          className="features-tour-header text-center"
        >
          <span className="section-badge">✨ Product Capabilities</span>
          <h1>KisanAI Digital Farming Suite</h1>
          <p>Explore the full suite of agritech features designed to optimize crop yield, manage finances, and consult agronomy experts.</p>
        </motion.div>

        {/* Features Tour Grid */}
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          className="features-tour-grid"
        >
          {featuresList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div key={idx} variants={slideUp} className="feat-card glass-card flex-column">
                <div className="feat-card-header flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start' }}>
                  <div className="feat-icon-wrap flex-center">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3>{feat.title}</h3>
                    <span className="feat-tagline">{feat.tagline}</span>
                  </div>
                </div>
                
                <p className="feat-desc-text">{feat.description}</p>
                
                <div className="feat-benefits-block">
                  <span className="benefits-title">Key Capabilities:</span>
                  <div className="benefits-checklist flex-column">
                    {feat.benefits.map((b, bIdx) => (
                      <div key={bIdx} className="benefit-item flex-center">
                        <CheckCircle2 size={14} className="check-icon" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <style>{`
        .features-tour-root {
          background-color: var(--bg-secondary);
          min-height: 100vh;
          width: 100%;
          padding: 3rem 2rem 5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .features-tour-container {
          max-width: 1200px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        .features-tour-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .features-tour-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0.5rem auto 0 auto;
          line-height: 1.5;
        }

        /* Features Grid */
        .features-tour-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .feat-card {
          background-color: var(--bg-primary);
          padding: 2.25rem;
          gap: 1.25rem;
          align-items: flex-start;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .feat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .feat-icon-wrap {
          width: 42px;
          height: 42px;
          background-color: var(--color-light-green);
          color: var(--color-primary);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        html[data-theme='dark'] .feat-icon-wrap {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .feat-card-header h3 {
          font-size: 1.2rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .feat-tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-top: 0.15rem;
        }

        .feat-desc-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .feat-benefits-block {
          width: 100%;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .benefits-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .benefits-checklist {
          align-items: flex-start;
          gap: 0.5rem;
        }

        .benefit-item {
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-primary);
          text-align: left;
        }

        .check-icon {
          color: var(--color-primary);
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .features-tour-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .feat-card {
            padding: 1.75rem;
          }
        }

        @media (max-width: 576px) {
          .features-tour-root {
            padding: 3rem 1rem 4rem 1rem;
          }
          .features-tour-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-container flex-column flex-center">
      <div className="policy-card glass-card">
        <button className="btn btn-secondary btn-sm flex-center" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1>Terms of Service</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Last Updated: June 8, 2026</p>
        
        <div className="policy-text">
          <h3>1. Terms of Acceptance</h3>
          <p>By registering a KisanAI profile, you agree to these Terms of Service. If you do not agree, do not complete onboarding.</p>

          <h3>2. AI Advisory Limitations</h3>
          <p>Agronomic diagnoses and suggestions provided by the AI Copilot, Disease Scanner, or Weather recommendations represent recommendations only. They do not constitute professional agricultural chemical advice. KisanAI is not liable for crop yield failures resulting from spray dosages applied under AI suggestions.</p>

          <h3>3. Acceptable Use of Forums</h3>
          <p>Farmers agree to post constructive questions, updates, and photos to community feeds. Moderation protocols powered by community AI will flag and delete advertisements, spam, and non-agricultural content.</p>

          <h3>4. Governing Law</h3>
          <p>These terms are governed in accordance with local regulations of Karimnagar District, Telangana state, India.</p>
        </div>
      </div>

      <style>{`
        .policy-container {
          min-height: 100vh;
          width: 100vw;
          background-color: var(--bg-secondary);
          padding: 2rem;
        }
        .policy-card {
          background-color: var(--bg-primary);
          max-width: 650px;
          padding: 2.5rem;
        }
        .policy-card h1 {
          font-size: 2rem;
          font-weight: 800;
        }
        .policy-text h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 1.25rem 0 0.5rem;
        }
        .policy-text p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

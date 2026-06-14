import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-container flex-column flex-center">
      <div className="policy-card glass-card">
        <button className="btn btn-secondary btn-sm flex-center" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1>Privacy Policy</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Last Updated: June 8, 2026</p>
        
        <div className="policy-text">
          <h3>1. Data We Collect</h3>
          <p>KisanAI collects farm parameters including GPS coordinates, farm size in acres, crop selections, financial ledger transaction records, and plant leaf photos uploaded for disease diagnostic testing.</p>

          <h3>2. Processing of Visual Image Telemetry</h3>
          <p>Photos of crop leaf spots are analyzed using local computer vision and Google Gemini API to identify agricultural pathogens. Image data is used solely for agronomic diagnostics and community advisory posts when authorized by the user.</p>

          <h3>3. Data Sharing</h3>
          <p>We do not sell personal farmer data or coordinates to third-party aggregators. Aggregate crop yield estimation data may be shared with banking partners for subsidy and micro-loan eligibility assessments under user consent.</p>

          <h3>4. Contact Details</h3>
          <p>For data queries, reach out to Founder Abhiram Pulkam at privacy@kisanai.in, Karimnagar, Telangana, India.</p>
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

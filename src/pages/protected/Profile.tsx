import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Language } from '../../context/LanguageContext';
import { User, Bell, Languages, Info, Landmark } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, completeOnboarding, updateUserRole, isFirebase } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState(user?.displayName || 'Farmer');
  const [email, setEmail] = useState(user?.email || 'farmer@kisanai.com');
  const [phone, setPhone] = useState(user?.phoneNumber || '+91 98765 43210');
  const [role, setRole] = useState(user?.role || 'farmer');

  const [weatherAlerts, setWeatherAlerts] = useState(user?.preferences?.weatherAlerts ?? true);
  const [diseaseAlerts, setDiseaseAlerts] = useState(user?.preferences?.diseaseAlerts ?? true);
  const [schemeAlerts, setSchemeAlerts] = useState(user?.preferences?.schemeAlerts ?? true);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save account role
    await updateUserRole(role as any);
    
    // Complete onboarding-like sync for preferences update
    completeOnboarding({
      language,
      firstFarm: {
        name: 'Farm A',
        location: 'Karimnagar',
        crop: 'Cotton',
        area: 3,
        soilType: 'Loam Soil',
        irrigation: 'Drip'
      },
      alerts: {
        weather: weatherAlerts,
        disease: diseaseAlerts,
        schemes: schemeAlerts
      }
    });

    // Save customized user state
    if (user) {
      const updated = {
        ...user,
        displayName: name,
        email: email,
        phoneNumber: phone
      };
      const storageKey = isFirebase ? `kisan_user_${user.uid}` : 'kisan_user';
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }

    alert('Profile preferences saved successfully!');
  };

  return (
    <div className="profile-page-layout">
      <div className="profile-header glass-card">
        <h2>{t('nav.profile')}</h2>
        <p className="text-muted">Manage your language switcher selections, weather warnings preferences, and personal details</p>
      </div>

      <main className="profile-main-split">
        {/* Left Side: General Profile edit */}
        <section className="profile-form-card glass-card">
          <div className="form-header flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <User size={20} className="icon-primary" />
            <h3>Personal Coordinates</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="profile-edit-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                required
                value={name} 
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (for SMS Alerts)</label>
              <input 
                type="text" 
                className="form-input" 
                required
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Application Language</label>
              <select 
                className="form-input" 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Role</label>
              <input 
                type="text" 
                className="form-input" 
                value={role === 'admin' ? 'Administrator (Admin)' : 'Farmer (User)'} 
                disabled 
                style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', textTransform: 'capitalize' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Account Settings</button>
          </form>
        </section>

        {/* Right Side: Alerts settings & Founder info card */}
        <div className="profile-sidebar-pane flex-column" style={{ gap: '1.5rem' }}>
          {/* Alerts card */}
          <div className="alerts-pref-card glass-card">
            <div className="form-header flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <Bell size={20} className="icon-primary" />
              <h3>Notification Services</h3>
            </div>

            <div className="alerts-checkboxes flex-column" style={{ gap: '1rem' }}>
              <div className="pref-checkbox-row flex-between">
                <div>
                  <h4 style={{ fontSize: '0.9rem' }}>Hyperlocal Weather Warnings</h4>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>SMS notification if rain probability exceeds 70% within 12 hours.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle-checkbox" 
                  checked={weatherAlerts}
                  onChange={(e) => setWeatherAlerts(e.target.checked)}
                />
              </div>

              <div className="pref-checkbox-row flex-between">
                <div>
                  <h4 style={{ fontSize: '0.9rem' }}>Foliar Infection Alerts</h4>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>SMS notification of pest risk outbreaks reported near Karimnagar.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle-checkbox" 
                  checked={diseaseAlerts}
                  onChange={(e) => setDiseaseAlerts(e.target.checked)}
                />
              </div>

              <div className="pref-checkbox-row flex-between">
                <div>
                  <h4 style={{ fontSize: '0.9rem' }}>Government Schemes release notifications</h4>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Instant updates regarding PM-KISAN, Rythu Bandhu claims timelines.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle-checkbox" 
                  checked={schemeAlerts}
                  onChange={(e) => setSchemeAlerts(e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Startup info card */}
          <div className="startup-credits-card glass-card">
            <div className="form-header flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <Landmark size={20} className="icon-primary" />
              <h3>KisanAI Credits</h3>
            </div>
            
            <div className="credits-list flex-column" style={{ gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>🏢 <strong>Company:</strong> KisanAI Agritech Operating System</div>
              <div>📍 <strong>HQ:</strong> Karimnagar, Telangana, India</div>
              <div>👤 <strong>Founder:</strong> Abhiram Pulkam</div>
              <div>🌍 <strong>Mission:</strong> India's most trusted agricultural intelligence platform.</div>
            </div>
          </div>

        </div>
      </main>

      <style>{`
        .profile-page-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .profile-header {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .profile-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        /* Split layouts */
        .profile-main-split {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 2rem;
        }

        .profile-form-card {
          background-color: var(--bg-primary);
          padding: 2rem;
        }

        .icon-primary { color: var(--color-primary); }

        .profile-edit-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Alerts card items */
        .alerts-pref-card, .startup-credits-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .pref-checkbox-row {
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .pref-checkbox-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .toggle-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .profile-main-split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, AlertCircle, Mail, MapPin, Layers, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

export const Login: React.FC = () => {
  const { 
    loginWithGoogle, 
    loginWithUsername, 
    registerWithUsername, 
    sendVerificationEmail, 
    verifyEmailCode, 
    completeOnboarding,
    isFirebase
  } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Mode & Loading states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Reset Fields
  const [resetPhone, setResetPhone] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  
  // New Farmer 5-Step Registration states
  const [registerStep, setRegisterStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [locationText, setLocationText] = useState('');
  const [cropType, setCropType] = useState('Cotton');
  const [soilType, setSoilType] = useState('Loam Soil');
  const [irrigation, setIrrigation] = useState('Drip Irrigation');
  const [verificationPin, setVerificationPin] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const userProfile = await loginWithGoogle(!isRegisterMode);
      if (userProfile.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError('Google Login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      const userProfile = await loginWithUsername(username, password);
      if (userProfile.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError('Login failed. Please check credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !password) {
      setError('Please fill in all profile fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userProfile = await registerWithUsername(username, password, fullName, phone);
      if (userProfile.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !resetNewPassword) {
      setError('Please fill in username and new password.');
      return;
    }
    if (resetNewPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await api.auth.resetPassword({
        username,
        phoneNumber: resetPhone,
        newPassword: resetNewPassword
      });
      setSuccessMessage('Password reset successfully! You can now log in.');
      setIsResetMode(false);
      setUsername('');
      setResetPhone('');
      setResetNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Verify your username and phone number.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper flex-center">
      <motion.div 
        className="login-card glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: isRegisterMode ? '480px' : '400px' }}
      >
        <div className="login-brand text-center">
          <span className="brand-logo">🌾</span>
          <h2>{isResetMode ? 'Reset Password' : isRegisterMode ? 'New Farmer Registration' : 'Farmer Login'}</h2>
          <p className="text-muted">{t('brand.tagline')}</p>
        </div>

        {/* Tab Toggle (Hidden during Step 2 verification or Reset mode) */}
        {registerStep < 2 && !isResetMode && (
          <div className="login-mode-tabs flex-between">
            <button 
              type="button" 
              className={`mode-tab ${!isRegisterMode ? 'active' : ''}`}
              onClick={() => {
                setIsRegisterMode(false);
                setIsResetMode(false);
                setRegisterStep(1);
                setError('');
                setSuccessMessage('');
              }}
            >
              Login
            </button>
            <button 
              type="button" 
              className={`mode-tab ${isRegisterMode ? 'active' : ''}`}
              onClick={() => {
                setIsRegisterMode(true);
                setIsResetMode(false);
                setRegisterStep(1);
                setError('');
                setSuccessMessage('');
              }}
            >
              Register
            </button>
          </div>
        )}

        {successMessage && (
          <div className="success-box flex-center" style={{
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#22c55e',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            gap: '0.5rem',
            fontWeight: 600
          }}>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="error-box flex-center">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* MODE 1: Login Form */}
        {!isRegisterMode && !isResetMode && (
          <form onSubmit={handleEmailLogin} className="login-form flex-column" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. farmer_abhiram"
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('common.password')}</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex-end" style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                className="btn-text-only green-text"
                style={{ fontSize: '0.85rem', fontWeight: 600 }}
                onClick={() => {
                  setIsResetMode(true);
                  setIsRegisterMode(false);
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : t('common.login')}
            </button>
          </form>
        )}

        {/* MODE 3: Reset Password Form */}
        {isResetMode && (
          <form onSubmit={handleResetPassword} className="login-form flex-column" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. farmer_abhiram"
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (registered)</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+91 98765 43210" 
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                required 
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary flex-center" 
              style={{ width: '100%', gap: '0.5rem' }}
              onClick={() => {
                setIsResetMode(false);
                setError('');
                setSuccessMessage('');
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        {/* MODE 2: Registration Form */}
        {isRegisterMode && (
          <form onSubmit={handleRegisterInitiate} className="login-form flex-column" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="Abhiram Pulkam" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="e.g. farmer_abhiram" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+91 98765 43210" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary flex-center" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              <span>{loading ? 'Registering...' : 'Register & Log In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Google sign-in */}
        {registerStep < 5 && (
          <>
            <div className="divider-row text-center text-muted">
              <span>OR</span>
            </div>

            <button 
              className="btn btn-secondary google-signin-btn flex-center"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ width: '100%', gap: '0.75rem' }}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.525 0-6.39-2.865-6.39-6.39s2.865-6.39 6.39-6.39c1.6 0 3.037.59 4.148 1.554l3.12-3.12C18.423 1.622 15.534.8 12.24.8 6.002.8 1 5.802 1 12.04s5.002 11.24 11.24 11.24c6.335 0 11.24-4.478 11.24-11.24 0-.693-.07-1.373-.203-2.04H12.24z"/>
              </svg>
              <span>{isRegisterMode ? 'Register with Google' : t('common.googleLogin')}</span>
            </button>
          </>
        )}
      </motion.div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          width: 100vw;
          background-color: var(--bg-secondary);
          padding: 2rem;
        }

        .login-card {
          background-color: var(--bg-primary);
          width: 100%;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: all var(--transition-normal);
        }

        .brand-logo {
          font-size: 3rem;
          display: inline-block;
          margin-bottom: 0.5rem;
        }

        .login-brand h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .divider-row {
          position: relative;
          margin: 0.5rem 0;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .divider-row::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 40%;
          height: 1px;
          background-color: var(--border-color);
        }

        .divider-row::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 0;
          width: 40%;
          height: 1px;
          background-color: var(--border-color);
        }

        .google-signin-btn {
          border: 1.5px solid var(--border-color);
        }

        .google-icon {
          display: block;
        }

        .error-box {
          background-color: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-danger);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          gap: 0.5rem;
          font-weight: 600;
        }

        .login-mode-tabs {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          display: flex;
        }

        .mode-tab {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.5rem;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .mode-tab.active {
          background-color: var(--bg-primary);
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        /* Progress Steps */
        .register-progress-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .step-count-txt {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--color-primary);
        }

        .step-name-txt {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .step-bar-bg {
          height: 6px;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .step-bar-fill {
          height: 100%;
          background-color: var(--color-primary);
          border-radius: var(--radius-full);
          transition: width var(--transition-normal) cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-text-only {
          background: none;
          border: none;
          cursor: pointer;
          outline: none;
        }

        .green-text {
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};

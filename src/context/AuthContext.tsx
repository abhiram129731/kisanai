import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { api } from '../services/api';

export interface UserProfile {
  uid: string;
  username?: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string;
  isOnboarded: boolean;
  role?: 'admin' | 'farmer';
  emailVerified?: boolean;
  preferences?: {
    language: string;
    weatherAlerts: boolean;
    diseaseAlerts: boolean;
    schemeAlerts: boolean;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isFirebase: boolean;
  loginWithGoogle: (isOnboarded?: boolean) => Promise<UserProfile>;
  loginWithUsername: (username: string, password: string) => Promise<UserProfile>;
  registerWithUsername: (username: string, password: string, displayName: string, phone?: string) => Promise<UserProfile>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmailCode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserRole: (role: 'admin' | 'farmer') => void;
  completeOnboarding: (data: {
    language: string;
    firstFarm?: {
      name: string;
      location: string;
      crop: string;
      area: number;
      soilType: string;
      irrigation: string;
    };
    alerts: {
      weather: boolean;
      disease: boolean;
      schemes: boolean;
    };
  }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firebase Client Credentials Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseEnabled = !!(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let app: any = null;
let auth: any = null;
export let db: any = null; // Stays as null as we migrate database operations to MongoDB

if (isFirebaseEnabled) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (err) {
    console.error("Firebase App initialization failed:", err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebase] = useState<boolean>(isFirebaseEnabled);

  // Sync state on load: check MongoDB session token first, fallback to mock user
  useEffect(() => {
    // Seed admin user locally if not exists
    try {
      const savedReg = localStorage.getItem('kisan_registered_users');
      const registered = savedReg ? JSON.parse(savedReg) : {};
      if (!registered['admin']) {
        registered['admin'] = {
          password: 'AdminPassword123!',
          profile: {
            uid: 'user-mock-admin-system-111222',
            username: 'admin',
            email: null,
            displayName: 'System Administrator',
            photoURL: 'https://api.dicebear.com/7.x/initials/svg?seed=System%20Administrator',
            phoneNumber: '',
            isOnboarded: true,
            role: 'admin',
            emailVerified: true
          }
        };
        localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
      }
    } catch (e) {
      console.warn("Failed to seed fallback admin user:", e);
    }

    const fetchSession = async () => {
      const token = localStorage.getItem('kisan_auth_token');
      if (token) {
        try {
          const profile = await api.auth.me();
          setUser(profile);
          localStorage.setItem(`kisan_user_${profile.uid}`, JSON.stringify(profile));
          setLoading(false);
          return;
        } catch (err) {
          console.warn("[Auth Session] MongoDB session invalid or backend offline, checking fallback local profiles:", err);
        }
      }

      // Offline mock profile checking if backend is offline
      const savedUser = localStorage.getItem('kisan_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    fetchSession();

    // Subscribe to Firebase Auth state for Google sign-in transitions if active
    if (isFirebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const savedLocal = localStorage.getItem(`kisan_user_${firebaseUser.uid}`);
          const localData = savedLocal ? JSON.parse(savedLocal) : null;
          const isLocalVerified = localStorage.getItem(`kisan_verified_${firebaseUser.uid}`) === 'true';
          
          const savedReg = localStorage.getItem('kisan_registered_users');
          const registered = savedReg ? JSON.parse(savedReg) : {};
          const existingRecord = Object.values(registered).find(
            (r: any) => r.profile && r.profile.email === firebaseUser.email
          ) as any;
          
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.email?.split('@')[0] || 'farmer',
            displayName: firebaseUser.displayName || localData?.displayName || existingRecord?.profile?.displayName || 'Farmer',
            photoURL: firebaseUser.photoURL || localData?.photoURL || existingRecord?.profile?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.email}`,
            phoneNumber: firebaseUser.phoneNumber || localData?.phoneNumber || existingRecord?.profile?.phoneNumber || undefined,
            isOnboarded: localData ? localData.isOnboarded : (existingRecord ? existingRecord.profile.isOnboarded : false),
            role: firebaseUser.email === 'abhiram.pulkam@kisanai.com' ? 'admin' : (localData?.role || existingRecord?.profile?.role || 'farmer'),
            emailVerified: (firebaseUser.emailVerified || isLocalVerified) ?? false,
            preferences: localData?.preferences || existingRecord?.profile?.preferences
          };
          
          setUser(profile);
          localStorage.setItem(`kisan_user_${firebaseUser.uid}`, JSON.stringify(profile));
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const loginWithGoogle = async (isOnboarded: boolean = false): Promise<UserProfile> => {
    setLoading(true);
    if (isFirebaseEnabled && auth) {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        let finalUser: UserProfile;
        try {
          // Register/Login in MongoDB
          const data = await api.auth.google({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          
          localStorage.setItem('kisan_auth_token', data.token);
          localStorage.setItem(`kisan_user_${data.user.uid}`, JSON.stringify(data.user));
          finalUser = data.user;
        } catch (apiErr) {
          console.warn("[AuthContext] Failed to sync Google login with MongoDB backend, logging in locally:", apiErr);
          const savedReg = localStorage.getItem('kisan_registered_users');
          const registered = savedReg ? JSON.parse(savedReg) : {};
          const existingRecord = Object.values(registered).find(
            (r: any) => r.profile && r.profile.email === firebaseUser.email
          ) as any;
          finalUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.email?.split('@')[0] || 'farmer',
            displayName: firebaseUser.displayName || existingRecord?.profile?.displayName || 'Farmer',
            photoURL: firebaseUser.photoURL || existingRecord?.profile?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.email || '')}`,
            isOnboarded: existingRecord ? existingRecord.profile.isOnboarded : false,
            role: firebaseUser.email === 'abhiram.pulkam@kisanai.com' ? 'admin' : (existingRecord?.profile?.role || 'farmer'),
            emailVerified: firebaseUser.emailVerified
          };
          localStorage.setItem('kisan_auth_token', 'mock-google-token-12345');
          localStorage.setItem('kisan_user', JSON.stringify(finalUser));
          
          // Persist in machine local database to preserve onboarding state across logouts
          const userKey = (finalUser.username || finalUser.email || '').toLowerCase();
          if (userKey) {
            registered[userKey] = {
              password: 'google-sso-placeholder-pass',
              profile: finalUser
            };
            localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
          }
        }
        
        setUser(finalUser);
        return finalUser;
      } catch (err: any) {
        console.warn("signInWithPopup failed, trying redirect:", err);
        try {
          await signInWithRedirect(auth, provider);
          return {
            uid: 'pending',
            email: null,
            displayName: 'Redirecting...',
            photoURL: null,
            isOnboarded: false
          };
        } catch (redirErr: any) {
          console.error("Firebase Google Sign In Redirect Error:", redirErr);
          throw new Error(redirErr.message || "Google Authentication failed.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Mock Google sign in
      try {
        const mockGoogleData = {
          uid: 'google-mock-' + Math.random().toString(36).substr(2, 9),
          email: 'abhiram.pulkam@kisanai.com',
          displayName: 'Abhiram Pulkam',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
        };

        let finalUser;
        try {
          // Attempt connecting to backend if active
          const data = await api.auth.google(mockGoogleData);
          localStorage.setItem('kisan_auth_token', data.token);
          finalUser = data.user;
        } catch (apiErr) {
          console.warn("Express backend offline, logging in as local storage simulated user:", apiErr);
          const savedReg = localStorage.getItem('kisan_registered_users');
          const registered = savedReg ? JSON.parse(savedReg) : {};
          const existingRecord = Object.values(registered).find(
            (r: any) => r.profile && r.profile.email === mockGoogleData.email
          ) as any;
          finalUser = {
            ...mockGoogleData,
            username: mockGoogleData.email.split('@')[0],
            isOnboarded: existingRecord ? existingRecord.profile.isOnboarded : isOnboarded,
            role: 'farmer' as const,
            emailVerified: true
          };
          localStorage.setItem('kisan_auth_token', 'mock-google-token-12345');
          
          const userKey = (finalUser.username || finalUser.email || '').toLowerCase();
          if (userKey) {
            registered[userKey] = {
              password: 'google-sso-placeholder-pass',
              profile: finalUser
            };
            localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
          }
        }

        setUser(finalUser);
        localStorage.setItem('kisan_user', JSON.stringify(finalUser));
        return finalUser;
      } finally {
        setLoading(false);
      }
    }
  };

  const loginWithUsername = async (username: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      // 1. Try real login via MongoDB API
      const data = await api.auth.login({ username, password });
      localStorage.setItem('kisan_auth_token', data.token);
      localStorage.setItem(`kisan_user_${data.user.uid}`, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      console.warn("[Auth login] Direct MongoDB Login failed or server down. Falling back to local verification:", err.message);
      
      // Local storage fallback if MongoDB API is down or user wants mock
      const saved = localStorage.getItem('kisan_registered_users');
      const registered = saved ? JSON.parse(saved) : {};
      const userKey = username.toLowerCase();
      
      if (!registered[userKey]) {
        if (username.toLowerCase() === 'admin') {
          const uid = 'user-mock-admin-system-111222';
          const profile: UserProfile = {
            uid,
            username: 'admin',
            email: null,
            displayName: 'System Administrator',
            photoURL: 'https://api.dicebear.com/7.x/initials/svg?seed=System%20Administrator',
            phoneNumber: '',
            isOnboarded: true,
            role: 'admin',
            emailVerified: true
          };
          registered[userKey] = { password, profile };
          localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
          setUser(profile);
          localStorage.setItem('kisan_user', JSON.stringify(profile));
          return profile;
        }
        throw new Error("User credentials not found on server. Please register first.");
      }
      
      const record = registered[userKey];
      if (record.password !== password) {
        throw new Error("Invalid credentials password.");
      }
      
      localStorage.setItem('kisan_auth_token', 'mock-jwt-token-12345');
      setUser(record.profile);
      localStorage.setItem('kisan_user', JSON.stringify(record.profile));
      return record.profile;
    } finally {
      setLoading(false);
    }
  };  const registerWithUsername = async (username: string, password: string, displayName: string, phone?: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      // 1. Try real registration via MongoDB API
      const data = await api.auth.register({ username, password, displayName, phone });
      localStorage.setItem('kisan_auth_token', data.token);
      localStorage.setItem(`kisan_user_${data.user.uid}`, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      console.warn("[Auth register] Direct MongoDB Register failed or server down. Falling back to local storage:", err.message);

      // Local storage fallback
      const saved = localStorage.getItem('kisan_registered_users');
      const registered = saved ? JSON.parse(saved) : {};
      const userKey = username.toLowerCase();
      
      if (registered[userKey]) {
        // If password matches, log them in directly
        if (registered[userKey].password === password) {
          const profile = registered[userKey].profile;
          setUser(profile);
          localStorage.setItem('kisan_user', JSON.stringify(profile));
          return profile;
        }
        throw new Error("Username already exists.");
      }
      
      const uid = 'user-mock-' + btoa(username.toLowerCase()).replace(/=/g, '');
      const profile: UserProfile = {
        uid,
        username: username.toLowerCase(),
        email: null,
        displayName: displayName,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
        phoneNumber: phone || '',
        isOnboarded: false, // Force new users to complete onboarding
        role: username.toLowerCase() === 'admin' ? 'admin' : 'farmer',
        emailVerified: false
      };
      registered[userKey] = { password, profile };
      localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
      
      localStorage.setItem('kisan_auth_token', 'mock-jwt-token-12345');
      setUser(profile);
      localStorage.setItem('kisan_user', JSON.stringify(profile));
      return profile;
    } finally {
      setLoading(false);
    }
  };
  const sendVerificationEmail = async (): Promise<void> => {
    // Return mock delay
    return new Promise(resolve => setTimeout(resolve, 500));
  };

  const verifyEmailCode = async (code: string): Promise<boolean> => {
    if (!user) return false;
    if (code === '123456') {
      const updated = { ...user, emailVerified: true };
      setUser(updated);
      localStorage.setItem('kisan_user', JSON.stringify(updated));

      // Update in registered users map
      if (user.email) {
        const saved = localStorage.getItem('kisan_registered_users');
        const registered = saved ? JSON.parse(saved) : {};
        const userKey = user.email.toLowerCase();
        if (registered[userKey]) {
          registered[userKey].profile = updated;
          localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
        }
      }
      localStorage.setItem(`kisan_verified_${user.uid}`, 'true');
      return true;
    }
    return false;
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        await firebaseSignOut(auth);
      }
      localStorage.removeItem('kisan_auth_token');
      localStorage.removeItem('kisan_user');
      if (user) {
        localStorage.removeItem(`kisan_user_${user.uid}`);
      }
      setUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (role: 'admin' | 'farmer') => {
    if (!user) return;
    const updatedProfile: UserProfile = {
      ...user,
      role
    };
    setUser(updatedProfile);
    localStorage.setItem('kisan_user', JSON.stringify(updatedProfile));
    localStorage.setItem(`kisan_user_${user.uid}`, JSON.stringify(updatedProfile));

    try {
      await api.auth.updateRole(role);
    } catch (err) {
      console.warn("Failed to sync role update to MongoDB, kept in local session:", err);
    }
  };

  const completeOnboarding = async (data: {
    language: string;
    firstFarm?: {
      name: string;
      location: string;
      crop: string;
      area: number;
      soilType: string;
      irrigation: string;
    };
    alerts: {
      weather: boolean;
      disease: boolean;
      schemes: boolean;
    };
  }) => {
    if (!user) return;
    
    const updatedProfile: UserProfile = {
      ...user,
      isOnboarded: true,
      role: user.role || 'farmer',
      preferences: {
        language: data.language,
        weatherAlerts: data.alerts.weather,
        diseaseAlerts: data.alerts.disease,
        schemeAlerts: data.alerts.schemes
      }
    };
    
    setUser(updatedProfile);
    localStorage.setItem('kisan_user', JSON.stringify(updatedProfile));
    localStorage.setItem(`kisan_user_${user.uid}`, JSON.stringify(updatedProfile));

    // Update in local registered users map
    const userKey = (user.username || user.email || '').toLowerCase();
    if (userKey) {
      const saved = localStorage.getItem('kisan_registered_users');
      const registered = saved ? JSON.parse(saved) : {};
      if (registered[userKey]) {
        registered[userKey].profile = updatedProfile;
        localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
      } else {
        const foundKey = Object.keys(registered).find(
          k => k === userKey || registered[k].profile?.email === userKey || registered[k].profile?.username === userKey
        );
        if (foundKey) {
          registered[foundKey].profile = updatedProfile;
          localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
        } else {
          // Save a new persistent profile to machine database for Google SSO / new fallbacks
          registered[userKey] = {
            password: 'sso-placeholder-pass',
            profile: updatedProfile
          };
          localStorage.setItem('kisan_registered_users', JSON.stringify(registered));
        }
      }
    }

    try {
      await api.auth.completeOnboarding({
        language: data.language,
        alerts: data.alerts
      });
    } catch (err) {
      console.warn("Failed to sync onboarding to MongoDB, saved in local session:", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isFirebase,
      loginWithGoogle,
      loginWithUsername,
      registerWithUsername,
      sendVerificationEmail,
      verifyEmailCode,
      logout,
      updateUserRole,
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

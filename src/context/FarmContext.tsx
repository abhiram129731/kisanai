import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

export interface FarmTimelineEvent {
  id: string;
  date: string;
  action: string;
  category: 'sowing' | 'fertilizer' | 'disease' | 'treatment' | 'harvest' | 'general';
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  crop: string;
  area: number;
  areaHectares?: number;
  areaSqm?: number;
  areaSqft?: number;
  perimeter?: number;
  soilType: string;
  irrigationMethod: string;
  notes: string;
  coordinates: { lat: number; lng: number }[];
  timeline: FarmTimelineEvent[];
}

export interface CashEntry {
  id: string;
  farmId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface DiseaseReport {
  id: string;
  farmId: string;
  date: string;
  cropType: string;
  diseaseName: string;
  confidence: number;
  description: string;
  prevention: string;
  treatment: string;
  fertilizer: string;
  imageUrl: string;
}

export interface SmartAlert {
  id: string;
  farmId: string;
  farmName: string;
  type: 'weather' | 'disease' | 'harvest' | 'irrigation' | 'scheme';
  message: string;
  severity: 'info' | 'warning' | 'danger';
  date: string;
  read: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorId?: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: { id: string; author: string; content: string; date: string }[];
  date: string;
  category: 'feed' | 'questions' | 'success' | 'trending';
  isExpertSolved?: boolean;
}

export interface Expert {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  avatar: string;
  online: boolean;
}

interface FarmContextType {
  farms: Farm[];
  cashEntries: CashEntry[];
  diseaseReports: DiseaseReport[];
  alerts: SmartAlert[];
  posts: CommunityPost[];
  experts: Expert[];
  addFarm: (farm: Omit<Farm, 'id' | 'timeline'>) => Promise<void>;
  updateFarm: (id: string, updated: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  addTimelineEvent: (farmId: string, event: Omit<FarmTimelineEvent, 'id'>) => Promise<void>;
  addCashEntry: (entry: Omit<CashEntry, 'id'>) => Promise<void>;
  deleteCashEntry: (id: string) => Promise<void>;
  addDiseaseReport: (report: Omit<DiseaseReport, 'id' | 'date'>) => Promise<void>;
  addCommunityPost: (post: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'date'>) => Promise<void>;
  deleteCommunityPost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, commentContent: string) => Promise<void>;
  markAlertAsRead: (alertId: string) => void;
  reloadData: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  const [farms, setFarms] = useState<Farm[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [experts] = useState<Expert[]>([]);

  // Function to fetch community posts separately
  const loadCommunityPosts = async () => {
    try {
      const token = localStorage.getItem('kisan_auth_token');
      if (token) {
        const mPosts = await api.community.getAll();
        const formattedPosts = mPosts.map((p: any) => ({
          id: p._id,
          author: p.author,
          authorId: p.userId,
          authorRole: p.authorRole,
          authorAvatar: p.authorAvatar,
          content: p.content,
          imageUrl: p.imageUrl,
          likes: typeof p.likes === 'number' ? p.likes : 0,
          comments: Array.isArray(p.comments) ? p.comments : [],
          date: p.date,
          category: p.category || 'feed'
        }));
        setPosts(formattedPosts);
        localStorage.setItem('kisan_posts_global', JSON.stringify(formattedPosts));
      }
    } catch (err) {
      console.warn("[FarmContext] Failed to load community posts in polling:", err);
    }
  };

  // Function to load all lists from backend or local cache fallbacks
  const loadData = async () => {
    if (userId === 'guest') {
      setFarms([]);
      setCashEntries([]);
      setDiseaseReports([]);
      setAlerts([]);
      setPosts([]);
      return;
    }

    // 1. Try loading from MongoDB API backend
    try {
      const token = localStorage.getItem('kisan_auth_token');
      if (token) {
        // Query Farms
        const mFarms = await api.farms.getAll();
        const formattedFarms = mFarms.map((f: any) => ({
          id: f._id,
          name: f.name,
          location: f.location,
          crop: f.crop,
          area: f.area,
          areaHectares: f.areaHectares,
          areaSqm: f.areaSqm,
          areaSqft: f.areaSqft,
          perimeter: f.perimeter,
          soilType: f.soilType,
          irrigationMethod: f.irrigationMethod,
          notes: f.notes,
          coordinates: f.coordinates,
          timeline: f.timeline
        }));
        setFarms(formattedFarms);
        localStorage.setItem(`kisan_farms_${userId}`, JSON.stringify(formattedFarms));

        // Query Cash entries
        const mCash = await api.cashbook.getAll();
        const formattedCash = mCash.map((c: any) => ({
          id: c._id,
          farmId: c.farmId,
          type: c.type,
          category: c.category,
          amount: c.amount,
          date: c.date,
          description: c.description
        }));
        setCashEntries(formattedCash);
        localStorage.setItem(`kisan_cash_${userId}`, JSON.stringify(formattedCash));

        // Query Disease reports
        const mDisease = await api.disease.getAll();
        const formattedDisease = mDisease.map((d: any) => ({
          id: d._id,
          farmId: d.farmId,
          date: d.date,
          cropType: d.cropType,
          diseaseName: d.diseaseName,
          confidence: d.confidence,
          description: d.description,
          prevention: d.prevention,
          treatment: d.treatment,
          fertilizer: d.fertilizer,
          imageUrl: d.imageUrl
        }));
        setDiseaseReports(formattedDisease);
        localStorage.setItem(`kisan_disease_${userId}`, JSON.stringify(formattedDisease));

        // Query Shared Community forum threads
        await loadCommunityPosts();

        // Derive Alerts dynamically from weather indices, disease scans, etc.
        const derivedAlerts: SmartAlert[] = [];
        formattedFarms.forEach((f: Farm) => {
          // Find if this farm has high severity disease scans
          const scan = formattedDisease.find((d: any) => d.farmId === f.id && d.confidence > 75);
          if (scan) {
            derivedAlerts.push({
              id: 'alert-disease-' + scan.id,
              farmId: f.id,
              farmName: f.name,
              type: 'disease',
              message: `High risk: crop blight detected on crop ${f.crop} with ${scan.confidence}% confidence.`,
              severity: 'danger',
              date: scan.date,
              read: false
            });
          }
        });
        setAlerts(derivedAlerts);
        localStorage.setItem(`kisan_alerts_${userId}`, JSON.stringify(derivedAlerts));
        return;
      }
    } catch (err) {
      console.warn("[FarmContext] Express API database query failure, offline cache default sync initialized:", err);
    }

    // 2. Offline caches recovery fallbacks
    const savedFarms = localStorage.getItem(`kisan_farms_${userId}`);
    if (savedFarms) setFarms(JSON.parse(savedFarms));

    const savedCash = localStorage.getItem(`kisan_cash_${userId}`);
    if (savedCash) setCashEntries(JSON.parse(savedCash));

    const savedDisease = localStorage.getItem(`kisan_disease_${userId}`);
    if (savedDisease) setDiseaseReports(JSON.parse(savedDisease));

    const savedAlerts = localStorage.getItem(`kisan_alerts_${userId}`);
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts));

    const savedPosts = localStorage.getItem('kisan_posts_global');
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        const sanitized = parsed.map((p: any) => ({
          ...p,
          likes: typeof p.likes === 'number' ? p.likes : 0,
          comments: Array.isArray(p.comments) ? p.comments : [],
          category: p.category || 'feed'
        }));
        setPosts(sanitized);
      } catch (err) {
        console.error("Failed to parse kisan_posts_global cache:", err);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    if (userId === 'guest') return;

    // Polling community posts every 15 seconds
    const interval = setInterval(() => {
      loadCommunityPosts();
    }, 15000);

    return () => clearInterval(interval);
  }, [userId]);

  // CRUD API Synchronization

  const addFarm = async (farmData: Omit<Farm, 'id' | 'timeline'>) => {
    try {
      const response = await api.farms.create(farmData);
      const newFarm: Farm = {
        id: response._id,
        name: response.name,
        location: response.location,
        crop: response.crop,
        area: response.area,
        areaHectares: response.areaHectares,
        areaSqm: response.areaSqm,
        areaSqft: response.areaSqft,
        perimeter: response.perimeter,
        soilType: response.soilType,
        irrigationMethod: response.irrigationMethod,
        notes: response.notes,
        coordinates: response.coordinates,
        timeline: response.timeline
      };
      setFarms(prev => [...prev, newFarm]);
    } catch (err) {
      console.warn("Express backend offline, caching farm profile locally:", err);
      // Fallback
      const newFarm: Farm = {
        ...farmData,
        id: 'farm-' + Math.random().toString(36).substr(2, 9),
        timeline: [
          {
            id: 't-init-' + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            action: `Farm Profile Created: growing ${farmData.crop}`,
            category: 'general'
          }
        ]
      };
      setFarms(prev => [...prev, newFarm]);
      localStorage.setItem(`kisan_farms_${userId}`, JSON.stringify([...farms, newFarm]));
    }
  };

  const updateFarm = async (id: string, updated: Partial<Farm>) => {
    try {
      await api.farms.update(id, updated);
      setFarms(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
    } catch (err) {
      console.warn("Failed to sync update to backend, writing to local storage cache:", err);
      setFarms(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
      localStorage.setItem(`kisan_farms_${userId}`, JSON.stringify(farms.map(f => f.id === id ? { ...f, ...updated } : f)));
    }
  };

  const deleteFarm = async (id: string) => {
    try {
      await api.farms.delete(id);
      setFarms(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.warn("Failed to sync delete to backend, updated local cache:", err);
      setFarms(prev => prev.filter(f => f.id !== id));
      localStorage.setItem(`kisan_farms_${userId}`, JSON.stringify(farms.filter(f => f.id !== id)));
    }
  };

  const addTimelineEvent = async (farmId: string, eventData: Omit<FarmTimelineEvent, 'id'>) => {
    const targetFarm = farms.find(f => f.id === farmId);
    if (!targetFarm) return;

    const newEvent: FarmTimelineEvent = {
      ...eventData,
      id: 'time-' + Math.random().toString(36).substr(2, 9)
    };

    const updatedTimeline = [...targetFarm.timeline, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    try {
      await api.farms.update(farmId, { timeline: updatedTimeline });
      setFarms(prev => prev.map(f => f.id === farmId ? { ...f, timeline: updatedTimeline } : f));
    } catch (err) {
      console.warn("Failed to sync timeline event to backend, updated local cache:", err);
      setFarms(prev => prev.map(f => f.id === farmId ? { ...f, timeline: updatedTimeline } : f));
      localStorage.setItem(`kisan_farms_${userId}`, JSON.stringify(farms.map(f => f.id === farmId ? { ...f, timeline: updatedTimeline } : f)));
    }
  };

  const addCashEntry = async (entryData: Omit<CashEntry, 'id'>) => {
    try {
      const response = await api.cashbook.create(entryData);
      const newEntry: CashEntry = {
        id: response._id,
        farmId: response.farmId,
        type: response.type,
        category: response.category,
        amount: response.amount,
        date: response.date,
        description: response.description
      };
      setCashEntries(prev => [newEntry, ...prev]);

      // Automatically add to timeline if linked to a farm
      if (entryData.farmId) {
        const typeLabel = entryData.type === 'income' ? 'Income Logged' : 'Expense Logged';
        await addTimelineEvent(entryData.farmId, {
          date: entryData.date,
          action: `${typeLabel}: ${entryData.category} - ₹${entryData.amount}`,
          category: 'general'
        });
      }
    } catch (err) {
      console.warn("Failed to save transaction to MongoDB, using offline mock:", err);
      const newEntry: CashEntry = {
        ...entryData,
        id: 'cash-' + Math.random().toString(36).substr(2, 9)
      };
      setCashEntries(prev => [newEntry, ...prev]);
      localStorage.setItem(`kisan_cash_${userId}`, JSON.stringify([newEntry, ...cashEntries]));
    }
  };

  const deleteCashEntry = async (id: string) => {
    try {
      await api.cashbook.delete(id);
      setCashEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.warn("Failed to delete transaction on backend, updated local cache:", err);
      setCashEntries(prev => prev.filter(e => e.id !== id));
      localStorage.setItem(`kisan_cash_${userId}`, JSON.stringify(cashEntries.filter(e => e.id !== id)));
    }
  };

  const addDiseaseReport = async (reportData: Omit<DiseaseReport, 'id' | 'date'>) => {
    try {
      const response = await api.disease.create(reportData);
      const newReport: DiseaseReport = {
        id: response._id,
        farmId: response.farmId,
        date: response.date,
        cropType: response.cropType,
        diseaseName: response.diseaseName,
        confidence: response.confidence,
        description: response.description,
        prevention: response.prevention,
        treatment: response.treatment,
        fertilizer: response.fertilizer,
        imageUrl: response.imageUrl
      };
      setDiseaseReports(prev => [newReport, ...prev]);

      if (reportData.farmId && reportData.farmId !== 'None' && reportData.farmId !== '') {
        await addTimelineEvent(reportData.farmId, {
          date: newReport.date,
          action: `Disease Detected: ${reportData.diseaseName} (${reportData.confidence}% Confidence)`,
          category: 'disease'
        });
      }
    } catch (err) {
      console.warn("Failed to save disease scan to MongoDB, updating local cache:", err);
      const newReport: DiseaseReport = {
        ...reportData,
        id: 'dis-' + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0]
      };
      setDiseaseReports(prev => [newReport, ...prev]);
      localStorage.setItem(`kisan_disease_${userId}`, JSON.stringify([newReport, ...diseaseReports]));
    }
  };

  const addCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'date'>) => {
    try {
      const response = await api.community.create(postData);
      const newPost: CommunityPost = {
        id: response._id,
        author: response.author,
        authorId: response.userId,
        authorRole: response.authorRole,
        authorAvatar: response.authorAvatar,
        content: response.content,
        imageUrl: response.imageUrl,
        likes: response.likes,
        comments: response.comments,
        date: response.date,
        category: response.category
      };
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      console.warn("Failed to submit post to backend MongoDB database:", err);
      const newPost: CommunityPost = {
        ...postData,
        id: 'post-' + Math.random().toString(36).substr(2, 9),
        likes: 0,
        comments: [],
        date: new Date().toISOString()
      };
      setPosts(prev => [newPost, ...prev]);
      localStorage.setItem('kisan_posts_global', JSON.stringify([newPost, ...posts]));
    }
  };

  const deleteCommunityPost = async (postId: string) => {
    try {
      await api.community.delete(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.warn("Failed to delete post on backend, updating local state:", err);
      const updatedPosts = posts.filter(p => p.id !== postId);
      setPosts(updatedPosts);
      localStorage.setItem('kisan_posts_global', JSON.stringify(updatedPosts));
    }
  };

  const likePost = async (postId: string) => {
    try {
      const response = await api.community.like(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: response.likes } : p));
    } catch (err) {
      console.warn("Failed to sync post like state, updating local display counter:", err);
      const updatedPosts = posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p);
      setPosts(updatedPosts);
      localStorage.setItem('kisan_posts_global', JSON.stringify(updatedPosts));
    }
  };

  const addComment = async (postId: string, commentContent: string) => {
    try {
      const comment = await api.community.comment(postId, commentContent);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, comment] };
        }
        return p;
      }));
    } catch (err) {
      console.warn("Failed to push comment to backend community post:", err);
      const newComment = {
        id: 'comment-' + Math.random().toString(36).substr(2, 9),
        author: user?.displayName || 'Farmer',
        content: commentContent,
        date: new Date().toISOString()
      };
      const updatedPosts = posts.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      });
      setPosts(updatedPosts);
      localStorage.setItem('kisan_posts_global', JSON.stringify(updatedPosts));
    }
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
  };

  const reloadData = () => {
    loadData();
  };

  return (
    <FarmContext.Provider value={{
      farms,
      cashEntries,
      diseaseReports,
      alerts,
      posts,
      experts,
      addFarm,
      updateFarm,
      deleteFarm,
      addTimelineEvent,
      addCashEntry,
      deleteCashEntry,
      addDiseaseReport,
      addCommunityPost,
      deleteCommunityPost,
      likePost,
      addComment,
      markAlertAsRead,
      reloadData
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarms = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarms must be used within a FarmProvider');
  }
  return context;
};

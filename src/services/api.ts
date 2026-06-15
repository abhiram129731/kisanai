// API service to communicate with the MongoDB Express Backend

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get authorization headers
const getHeaders = () => {
  const token = localStorage.getItem('kisan_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Generic fetch wrapper
const request = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed.');
  }

  return data;
};

export const api = {
  // Authentication
  auth: {
    register: (body: any) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    login: (body: any) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    google: (body: any) => request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    me: () => request('/auth/me', {
      method: 'GET'
    }),
    completeOnboarding: (body: any) => request('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    updateRole: (role: 'farmer' | 'admin') => request('/auth/update-role', {
      method: 'POST',
      body: JSON.stringify({ role })
    }),
    getFarmers: () => request('/auth/farmers', {
      method: 'GET'
    })
  },

  // Farms CRUD
  farms: {
    getAll: () => request('/farms', {
      method: 'GET'
    }),
    create: (body: any) => request('/farms', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    update: (id: string, body: any) => request(`/farms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),
    delete: (id: string) => request(`/farms/${id}/delete`, {
      method: 'POST'
    })
  },

  // Cashbook CRUD
  cashbook: {
    getAll: () => request('/cashbook', {
      method: 'GET'
    }),
    create: (body: any) => request('/cashbook', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    delete: (id: string) => request(`/cashbook/${id}/delete`, {
      method: 'POST'
    })
  },

  // Disease Scan Diagnostics
  disease: {
    getAll: () => request('/disease', {
      method: 'GET'
    }),
    create: (body: any) => request('/disease', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  },

  // Community Forum
  community: {
    getAll: () => request('/community', {
      method: 'GET'
    }),
    create: (body: any) => request('/community', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    delete: (id: string) => request(`/community/${id}/delete`, {
      method: 'POST'
    }),
    like: (id: string) => request(`/community/${id}/like`, {
      method: 'POST'
    }),
    comment: (id: string, content: string) => request(`/community/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  },

  // Admin Dashboard
  admin: {
    getUsers: () => request('/admin/users', {
      method: 'GET'
    }),
    updateRole: (uid: string, role: 'farmer' | 'admin') => request(`/admin/users/${uid}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
    deleteUser: (uid: string) => request(`/admin/users/${uid}/delete`, {
      method: 'POST'
    }),
    getInquiries: () => request('/admin/inquiries', {
      method: 'GET'
    }),
    deleteInquiry: (id: string) => request(`/admin/inquiries/${id}/delete`, {
      method: 'POST'
    })
  },

  // Live Weather & AI recommendations
  weather: {
    get: (lat: number | string, lng: number | string, crop?: string) => 
      request(`/weather?lat=${lat}&lng=${lng}${crop ? `&crop=${encodeURIComponent(crop)}` : ''}`, {
        method: 'GET'
      })
  },

  // Public Contact Inquiry
  contact: {
    submit: (body: { name: string; email: string; phone?: string; message: string }) => 
      request('/contact', {
        method: 'POST',
        body: JSON.stringify(body)
      })
  },

  // AI Chat Copilot and Conversations History
  chat: {
    getConversations: () => request('/chat/conversations', {
      method: 'GET'
    }),
    createConversation: (title?: string) => request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    }),
    getConversation: (id: string) => request(`/chat/conversations/${id}`, {
      method: 'GET'
    }),
    sendMessage: (id: string, text: string, language?: string) => request(`/chat/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, language })
    }),
    deleteConversation: (id: string) => request(`/chat/conversations/${id}`, {
      method: 'DELETE'
    }),
    search: (q: string) => request(`/chat/search?q=${encodeURIComponent(q)}`, {
      method: 'GET'
    }),
    getSavedRecommendations: () => request('/chat/recommendations/saved', {
      method: 'GET'
    }),
    saveRecommendation: (body: { farmId?: string; farmName?: string; type: 'irrigation' | 'spray' | 'harvest' | 'general'; recommendation: string }) => request('/chat/recommendations/save', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    deleteRecommendation: (id: string) => request(`/chat/recommendations/${id}/delete`, {
      method: 'POST'
    })
  }
};


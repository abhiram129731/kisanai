// Client-side Gemini AI integration proxy
// Reroutes all model prompts to the secure Node/Express backend endpoints to prevent client-side API key leakage.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('kisan_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export async function analyzeCropDisease(base64Image: string, cropType: string, language: string = 'en') {
  try {
    const response = await fetch(`${BASE_URL}/disease/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image: base64Image, cropType, language })
    });
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling secure crop analysis backend:', error);
    throw error;
  }
}

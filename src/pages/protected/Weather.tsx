import React, { useState, useMemo, useEffect } from 'react';
import { useFarms } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  CloudSun, CloudRain, Wind, Droplets, Sun, 
  AlertTriangle, Lightbulb, RefreshCw, Clock 
} from 'lucide-react';

export const Weather: React.FC = () => {
  const { farms } = useFarms();
  const { t } = useLanguage();
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || 'current_gps');

  const activeFarm = useMemo(() => {
    if (selectedFarmId === 'current_gps') return null;
    return farms.find(f => f.id === selectedFarmId) || null;
  }, [farms, selectedFarmId]);

  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchTelemetry = async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    setError(null);

    const loadWeather = async (lat: number, lng: number, crop: string) => {
      try {
        const data = await api.weather.get(lat, lng, crop);
        setWeatherData(data);
        setLastRefreshed(new Date());
        setError(null);
      } catch (err: any) {
        console.error('[Weather UI] Live weather proxy fetch failed:', err);
        setError(err.message || 'Failed to query live weather intelligence.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    if (selectedFarmId === 'current_gps' || !activeFarm) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            loadWeather(latitude, longitude, 'General');
          },
          (err) => {
            console.warn("Geolocation permission error or timeout, defaulting to India center fallback:", err);
            // Default center coordinates: Geometric Center of India
            loadWeather(20.5937, 78.9629, 'General');
          },
          { timeout: 5000, enableHighAccuracy: true }
        );
      } else {
        loadWeather(20.5937, 78.9629, 'General');
      }
    } else {
      const rawCoords = (activeFarm.coordinates && activeFarm.coordinates[0]) || { lat: 20.5937, lng: 78.9629 };
      const lat = (rawCoords && typeof rawCoords.lat === 'number' && !isNaN(rawCoords.lat)) ? rawCoords.lat : 20.5937;
      const lng = (rawCoords && typeof rawCoords.lng === 'number' && !isNaN(rawCoords.lng)) ? rawCoords.lng : 78.9629;
      loadWeather(lat, lng, activeFarm.crop);
    }
  };

  // Trigger load when selected plot changes
  useEffect(() => {
    fetchTelemetry();

    // Configure 5-minute auto-refresh telemetry tracker
    const intervalId = setInterval(() => {
      console.log('[Weather Telemetry] 5-minute refresh active...');
      fetchTelemetry(true);
    }, 300000); // 300,000ms = 5 minutes

    return () => clearInterval(intervalId);
  }, [selectedFarmId]);

  if (loading) {
    return (
      <div className="flex-center flex-column" style={{ height: '70vh', gap: '1.5rem' }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p className="text-muted font-heading" style={{ fontWeight: 600 }}>Loading hyper-local weather telemetry...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="weather-page-layout">
      {/* Upper Selector Dashboard Card */}
      <div className="weather-selector-card glass-card flex-between">
        <div>
          <h2>{t('weather.title')}</h2>
          <p className="text-muted">Hyper-local climate monitoring linked to live coordinates</p>
          <div className="last-updated-row flex-center" style={{ gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={12} />
            <span>Updated at {lastRefreshed.toLocaleTimeString()}</span>
            {refreshing && <span className="refresh-dimmed">(refreshing...)</span>}
          </div>
        </div>
        
        <div className="flex-center" style={{ gap: '1rem' }}>
          <button 
            className={`btn btn-secondary refresh-btn flex-center ${refreshing ? 'spinning' : ''}`} 
            onClick={() => fetchTelemetry()}
            disabled={refreshing}
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            <RefreshCw size={16} />
          </button>
          
          <div className="farm-selector flex-center" style={{ gap: '0.75rem' }}>
            <select 
              className="form-input" 
              value={selectedFarmId} 
              onChange={(e) => setSelectedFarmId(e.target.value)}
              style={{ width: '220px', margin: 0 }}
            >
              <option value="current_gps">📍 Use Live Location</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="error-alert-card glass-card flex-center flex-column" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={40} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
          <h3>Weather Connection Offline</h3>
          <p className="text-muted" style={{ maxWidth: '400px', margin: '0.5rem 0 1.5rem' }}>
            Could not retrieve meteorological telemetry for your farm coordinates. Please check your internet connection and verify API configurations.
          </p>
          <button className="btn btn-primary" onClick={() => fetchTelemetry()}>Retry Connection</button>
        </div>
      ) : !weatherData ? (
        <div className="flex-center" style={{ height: '50vh' }}>
          <p className="text-muted">Weather data is temporarily unavailable for this plot.</p>
        </div>
      ) : (
        <>
          {/* Main Weather Telemetry Showcase */}
          <section className="weather-main-grid">
            {/* Left: Giant Temp Card */}
            <div className="weather-primary-card glass-card flex-center">
              <div className="primary-weather-body text-center">
                <span className="weather-farm-badge">{activeFarm ? activeFarm.name : '📍 Live Location'}</span>
                <div className="weather-icon-giant">
                  {weatherData.description === 'Rainy' ? '🌧️' : weatherData.description === 'Cloudy' ? '🌥️' : '☀️'}
                </div>
                <h1 className="weather-giant-temp">{weatherData.currentTemp}°C</h1>
                <p className="weather-condition-label">{weatherData.description}</p>
                <p className="weather-crop-target">{activeFarm ? `Monitoring ${activeFarm.crop} plot` : 'Monitoring browser coordinates'}</p>
              </div>
            </div>

            {/* Right: Detailed Climate Gauges */}
            <div className="weather-indices-grid">
              <div className="index-card glass-card">
                <div className="index-header flex-between">
                  <span className="index-label">{t('weather.rainProb')}</span>
                  <CloudRain size={20} className="index-icon blue-color" />
                </div>
                <div className="index-val">{weatherData.rainChance}%</div>
                <div className="progress-bar-bg"><div className="progress-bar-fill blue-bg" style={{ width: `${weatherData.rainChance}%` }}></div></div>
              </div>

              <div className="index-card glass-card">
                <div className="index-header flex-between">
                  <span className="index-label">{t('weather.windSpeed')}</span>
                  <Wind size={20} className="index-icon gray-color" />
                </div>
                <div className="index-val">{weatherData.windSpeed} km/h</div>
                <div className="progress-bar-bg"><div className="progress-bar-fill gray-bg" style={{ width: `${Math.min((weatherData.windSpeed / 40) * 100, 100)}%` }}></div></div>
              </div>

              <div className="index-card glass-card">
                <div className="index-header flex-between">
                  <span className="index-label">{t('weather.humidity')}</span>
                  <Droplets size={20} className="index-icon green-color" />
                </div>
                <div className="index-val">{weatherData.humidity}%</div>
                <div className="progress-bar-bg"><div className="progress-bar-fill green-bg" style={{ width: `${weatherData.humidity}%` }}></div></div>
              </div>

              <div className="index-card glass-card">
                <div className="index-header flex-between">
                  <span className="index-label">UV Index</span>
                  <Sun size={20} className="index-icon orange-color" />
                </div>
                <div className="index-val">{weatherData.uvIndex} / 10</div>
                <div className="progress-bar-bg"><div className="progress-bar-fill orange-bg" style={{ width: `${(weatherData.uvIndex / 10) * 100}%` }}></div></div>
              </div>
            </div>
          </section>

          {/* Warnings & AI Agronomic Tips */}
          <section className="weather-advisory-grid">
            <div className="advisory-card glass-card">
              <div className="advisory-title flex-center" style={{ gap: '0.5rem', color: 'var(--color-danger)' }}>
                <AlertTriangle size={20} />
                <h3>Smart Meteorological Alerts</h3>
              </div>
              
              <div className="alerts-list-body">
                {weatherData.alerts.length === 0 ? (
                  <p className="no-alert-msg">✓ No severe agricultural alerts expected in this boundary.</p>
                ) : (
                  weatherData.alerts.map((alert: string, idx: number) => (
                    <div key={idx} className="weather-alert-box">
                      <p>{alert}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="advisory-card glass-card color-primary-light">
              <div className="advisory-title flex-center" style={{ gap: '0.5rem', color: 'var(--color-primary)' }}>
                <Lightbulb size={20} />
                <h3>AI Crop Recommendation Advisory</h3>
              </div>
              <p className="ai-advisory-text">
                {weatherData.recommendation}
              </p>
            </div>
          </section>

          {/* 5-Day Forecast Grid */}
          <section className="forecast-section-card glass-card">
            <h3 style={{ marginBottom: '1.5rem' }}>{t('weather.forecast')}</h3>
            
            <div className="forecast-row-scroll">
              {weatherData.forecast.map((dayData: { day: string; temp: number; rainChance: number; condition: string }, idx: number) => (
                <div key={idx} className="forecast-day-card text-center">
                  <span className="forecast-day-name">{dayData.day}</span>
                  <div className="forecast-icon">
                    {dayData.condition === 'Sunny' ? '☀️' : dayData.condition === 'Heavy Rain' ? '🌧️' : dayData.condition === 'Showers' ? '🌦️' : '🌥️'}
                  </div>
                  <span className="forecast-temp">{dayData.temp}°C</span>
                  <span className="forecast-chance">🌧️ {dayData.rainChance}%</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <style>{`
        .weather-page-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .weather-selector-card {
          background-color: var(--bg-primary);
          padding: 1.25rem 1.5rem;
        }

        .weather-selector-card h2 {
          font-size: 1.4rem;
          font-weight: 800;
        }

        .refresh-dimmed {
          animation: skPulse 1s infinite alternate;
        }

        .refresh-btn.spinning svg {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Stats grids */
        .weather-main-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 1.5rem;
        }

        .weather-primary-card {
          background-color: var(--bg-primary);
          height: 280px;
        }

        .primary-weather-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .weather-farm-badge {
          background-color: var(--color-light-green);
          color: var(--color-primary);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .weather-icon-giant {
          font-size: 4rem;
        }

        .weather-giant-temp {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1;
        }

        .weather-condition-label {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .weather-crop-target {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .weather-indices-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .index-card {
          background-color: var(--bg-primary);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 135px;
        }

        .index-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .index-val {
          font-size: 1.75rem;
          font-weight: 800;
          font-family: var(--font-heading);
          margin-top: 0.5rem;
        }

        .progress-bar-bg {
          height: 6px;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-full);
          margin-top: 0.5rem;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
        }

        .blue-bg { background-color: #2563EB; }
        .gray-bg { background-color: #6B7280; }
        .green-bg { background-color: var(--color-primary); }
        .orange-bg { background-color: #F97316; }

        .blue-color { color: #2563EB; }
        .gray-color { color: #6B7280; }
        .green-color { color: var(--color-primary); }
        .orange-color { color: #F97316; }

        /* Advisories */
        .weather-advisory-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .advisory-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-height: 160px;
        }

        .advisory-card.color-primary-light {
          background-color: var(--color-light-green);
          border: 1px solid rgba(22, 163, 74, 0.2);
        }

        html[data-theme='dark'] .advisory-card.color-primary-light {
          background-color: rgba(22, 163, 74, 0.1);
        }

        .advisory-title h3 {
          font-size: 1.05rem;
          font-weight: 800;
        }

        .no-alert-msg {
          color: var(--color-success);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .weather-alert-box {
          background-color: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--color-danger);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .ai-advisory-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          white-space: pre-line;
        }

        /* Forecast */
        .forecast-section-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .forecast-row-scroll {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .forecast-day-card {
          flex: 1;
          min-width: 90px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 1rem 0.5rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .forecast-day-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .forecast-icon {
          font-size: 2.25rem;
        }

        .forecast-temp {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .forecast-chance {
          font-size: 0.75rem;
          color: #2563EB;
          font-weight: 600;
        }

        @keyframes skPulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .weather-main-grid {
            grid-template-columns: 1fr;
          }
          .weather-indices-grid {
            grid-template-columns: 1fr;
          }
          .weather-advisory-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .advisory-card {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

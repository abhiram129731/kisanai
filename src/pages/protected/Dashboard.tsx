import React, { useMemo, useState, useEffect } from 'react';
import { useFarms } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Sprout, CloudSun, TrendingUp, AlertTriangle, ArrowUpRight, DollarSign, Plus, Eye, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { farms, cashEntries, alerts } = useFarms();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [schemesCount, setSchemesCount] = useState(3);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kisan_managed_schemes');
      if (saved) {
        setSchemesCount(JSON.parse(saved).length);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Redirect if no farms are active
  const hasFarms = farms.length > 0;

  // Weather states for real API coordinates query
  const [farmWeathers, setFarmWeathers] = useState<Record<string, any>>({});
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fetch real-time weather coordinates updates for active farms
  useEffect(() => {
    if (farms.length === 0) return;

    let isMounted = true;
    setLoadingWeather(true);

    const fetchAllWeather = async () => {
      const weatherMap: Record<string, any> = {};
      for (const farm of farms) {
        const rawCoords = (farm.coordinates && farm.coordinates[0]) || { lat: 20.5937, lng: 78.9629 };
        const lat = (rawCoords && typeof rawCoords.lat === 'number' && !isNaN(rawCoords.lat)) ? rawCoords.lat : 20.5937;
        const lng = (rawCoords && typeof rawCoords.lng === 'number' && !isNaN(rawCoords.lng)) ? rawCoords.lng : 78.9629;
        const farmId = farm.id;
        try {
          const data = await api.weather.get(lat, lng, farm.crop);
          weatherMap[farmId] = data;
        } catch (err) {
          console.error('[Dashboard Weather] Failed to fetch weather for farm:', farmId, err);
          weatherMap[farmId] = {
            currentTemp: 28,
            description: 'Sunny',
            rainChance: 20,
            windSpeed: 12,
            humidity: 60,
            uvIndex: 5,
            recommendation: 'Irrigation: Proceed with standard drip cycle. Spraying: Optimal conditions.'
          };
        }
      }
      if (isMounted) {
        setFarmWeathers(weatherMap);
        setLoadingWeather(false);
      }
    };

    fetchAllWeather();

    return () => {
      isMounted = false;
    };
  }, [farms]);

  // 1. Calculate Financial Summary
  const financials = useMemo(() => {
    let income = 0;
    let expense = 0;
    cashEntries.forEach(entry => {
      if (entry.type === 'income') income += entry.amount;
      else expense += entry.amount;
    });
    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense
    };
  }, [cashEntries]);

  // 2. Format Cash Flow history for Recharts AreaChart
  const chartData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; Income: number; Expense: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize the last 6 months with 0 value defaults
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      monthlyMap[mName] = {
        month: mName,
        Income: 0,
        Expense: 0
      };
    }

    // Populate actuals
    cashEntries.forEach(entry => {
      const date = new Date(entry.date);
      const mName = months[date.getMonth()];
      if (monthlyMap[mName]) {
        if (entry.type === 'income') monthlyMap[mName].Income += entry.amount;
        else monthlyMap[mName].Expense += entry.amount;
      }
    });

    return Object.values(monthlyMap);
  }, [cashEntries]);

  // 3. Crop Yield forecasts distribution data for Recharts BarChart
  const cropForecastData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    farms.forEach(f => {
      const yieldEstimatePerAcre = f.crop === 'Cotton' ? 8 : f.crop === 'Paddy' ? 22 : 15; // Quintals
      const totalYield = f.area * yieldEstimatePerAcre;
      dataMap[f.crop] = (dataMap[f.crop] || 0) + totalYield;
    });

    return Object.entries(dataMap).map(([crop, val]) => ({
      name: crop,
      Yield: val
    }));
  }, [farms]);

  // 4. Load weather profiles for active farms
  const farmWeatherList = useMemo(() => {
    return farms.map(f => {
      const rawCoords = (f.coordinates && f.coordinates[0]) || { lat: 20.5937, lng: 78.9629 };
      const lat = (rawCoords && typeof rawCoords.lat === 'number' && !isNaN(rawCoords.lat)) ? rawCoords.lat : 20.5937;
      const lng = (rawCoords && typeof rawCoords.lng === 'number' && !isNaN(rawCoords.lng)) ? rawCoords.lng : 78.9629;
      const farmId = f.id;
      const weather = farmWeathers[farmId] || {
        currentTemp: 28,
        description: 'Sunny',
        rainChance: 20,
        windSpeed: 12,
        humidity: 60,
        uvIndex: 5,
        recommendation: 'Irrigation: Proceed with standard drip cycle. Spraying: Optimal conditions.'
      };
      return {
        farmId,
        farmName: f.name,
        crop: f.crop,
        weather
      };
    });
  }, [farms, farmWeathers]);

  // 5. Active Alerts
  const activeWarnings = useMemo(() => {
    return alerts.filter(a => !a.read).slice(0, 3);
  }, [alerts]);

  // 6. Soil Quality Score logic calculated dynamically
  const soilQualityScore = useMemo(() => {
    if (farms.length === 0) return 'N/A';
    const scoreMap: Record<string, number> = {
      'Loam Soil': 88,
      'Black Cotton Soil': 86,
      'Clay Soil': 74,
      'Red Soil': 70,
      'Sandy Soil': 62
    };

    let totalScore = 0;
    let totalArea = 0;
    farms.forEach(f => {
      const baseScore = scoreMap[f.soilType] || 75;
      totalScore += baseScore * f.area;
      totalArea += f.area;
    });

    if (totalArea === 0) return '75%';
    return `${Math.round(totalScore / totalArea)}%`;
  }, [farms]);

  const COLORS = ['#16A34A', '#22C55E', '#10B981', '#34D399'];

  if (!hasFarms) {
    return (
      <div className="dash-empty-wrapper flex-center">
        <motion.div 
          className="dash-empty-card text-center glass-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-icon-circle">🌾</div>
          <h2>Let's Setup Your Dashboard</h2>
          <p>{t('dash.emptyFarms')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/farms')}>
            <Plus size={18} /> {t('farm.add')}
          </button>
        </motion.div>
        
        <style>{`
          .dash-empty-wrapper {
            flex-grow: 1;
            height: 80vh;
          }
          .dash-empty-card {
            background-color: var(--bg-primary);
            max-width: 420px;
            padding: 3rem 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .empty-icon-circle {
            font-size: 3.5rem;
          }
          .dash-empty-card h2 {
            font-size: 1.5rem;
            font-weight: 800;
          }
          .dash-empty-card p {
            color: var(--text-secondary);
            font-size: 0.95rem;
            line-height: 1.5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {/* 1. Header Metrics Grid */}
      <section className="metrics-row">
        {/* Metric 1 */}
        <motion.div 
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="metric-header flex-between">
            <span className="metric-label">{t('dash.totalFarms')}</span>
            <div className="metric-icon flex-center"><Sprout size={18} /></div>
          </div>
          <div className="metric-val">{farms.length}</div>
          <div className="metric-sub text-muted">
            {farms.reduce((acc, curr) => acc + curr.area, 0)} Total Acres managed
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="metric-header flex-between">
            <span className="metric-label">{t('dash.netProfit')}</span>
            <div className="metric-icon flex-center" style={{ backgroundColor: 'var(--color-light-green)', color: 'var(--color-primary)' }}><DollarSign size={18} /></div>
          </div>
          <div className="metric-val text-gradient">₹{financials.netProfit.toLocaleString('en-IN')}</div>
          <div className="metric-sub text-muted">
            Inflow: ₹{financials.totalIncome.toLocaleString('en-IN')} | Out: ₹{financials.totalExpense.toLocaleString('en-IN')}
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="metric-header flex-between">
            <span className="metric-label">Soil Quality Score</span>
            <div className="metric-icon flex-center"><TrendingUp size={18} /></div>
          </div>
          <div className="metric-val">{soilQualityScore}</div>
          <div className="metric-sub text-muted">
            {soilQualityScore === 'N/A' ? 'No farm plots registered' : 'Optimal nutrient & pH balance'}
          </div>
        </motion.div>

        {/* Metric 4: Government Schemes */}
        <motion.div 
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={() => navigate('/schemes')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-header flex-between">
            <span className="metric-label">{language === 'te' ? 'ప్రభుత్వ పథకాలు' : language === 'hi' ? 'सरकारी योजनाएं' : 'Gov Schemes'}</span>
            <div className="metric-icon flex-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}><Award size={18} /></div>
          </div>
          <div className="metric-val text-gradient" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{schemesCount} Active</div>
          <div className="metric-sub text-muted" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            View Benefits & Portals →
          </div>
        </motion.div>
      </section>

      {/* 2. Charts and AI Ticker Section */}
      <section className="dashboard-charts-layout">
        {/* Main Cash Flow Chart */}
        <div className="chart-large-card glass-card">
          <div className="chart-header flex-between">
            <div>
              <h3>Financial Cashflow Trends</h3>
              <p className="text-muted">Monthly Revenue vs Expenses</p>
            </div>
            <button className="btn btn-secondary flex-center" onClick={() => navigate('/cashbook')}>
              View Cashbook <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="chart-container" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="Income" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Expense" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic AI Recommendation Ticker */}
        <div className="ticker-card glass-card flex-between">
          <span className="ticker-badge flex-center">💡 AI Tip</span>
          <div className="ticker-track">
            <p className="ticker-text">
              {farmWeatherList[0]?.weather?.recommendation || 'Keep monitoring soil moisture levels during hot spells.'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Farm Weather Telemetry & Yield Forecast Section */}
      <section className="dashboard-content-split">
        {/* Weather grids */}
        <div className="split-card glass-card">
          <div className="card-header flex-between">
            <h3>{t('dash.weatherSummary')}</h3>
            <div className="flex-center" style={{ gap: '0.75rem' }}>
              {loadingWeather && <span className="small-loading-spinner"></span>}
              <button className="btn btn-secondary flex-center" onClick={() => navigate('/weather')}>
                Details <CloudSun size={16} />
              </button>
            </div>
          </div>
          
          <div className="weather-farm-list">
            {farmWeatherList.map(item => (
              <div key={item.farmId} className="weather-farm-row flex-between">
                <div className="weather-farm-info">
                  <h4>{item.farmName}</h4>
                  <span className="badge badge-success">{item.crop}</span>
                </div>
                <div className="weather-farm-metrics">
                  <span className="weather-temp-badge">{item.weather.currentTemp}°C</span>
                  <span className="weather-desc-badge">{item.weather.description}</span>
                  <span className="weather-rain-badge">🌧️ {item.weather.rainChance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Yield estimates */}
        <div className="split-card glass-card">
          <div className="card-header">
            <h3>{t('dash.cropDistribution')}</h3>
            <p className="text-muted">Estimated Yield in Quintals based on acreage</p>
          </div>
          
          <div className="chart-container" style={{ height: 180 }}>
            {cropForecastData.length === 0 ? (
              <div className="flex-center" style={{ height: '100%' }}>No crop estimates available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="Yield" radius={[4, 4, 0, 0]}>
                    {cropForecastData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* 4. Alerts & Recent Expenses section */}
      <section className="dashboard-content-split">
        {/* Smart Warnings */}
        <div className="split-card glass-card">
          <div className="card-header">
            <h3>{t('dash.activeAlerts')}</h3>
          </div>
          
          <div className="dashboard-alerts-list">
            {activeWarnings.length === 0 ? (
              <div className="empty-alerts flex-center">✓ All farm operations running smoothly.</div>
            ) : (
              activeWarnings.map(alert => (
                <div key={alert.id} className={`dashboard-alert-item severity-${alert.severity} flex-between`}>
                  <div className="alert-body">
                    <div className="alert-meta flex-between">
                      <span className="alert-farm">{alert.farmName}</span>
                      <span className="alert-date">{alert.date}</span>
                    </div>
                    <p className="alert-msg">{alert.message}</p>
                  </div>
                  <AlertTriangle size={18} className="alert-icon" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Financials */}
        <div className="split-card glass-card">
          <div className="card-header flex-between">
            <h3>{t('dash.recentTransactions')}</h3>
            <button className="btn btn-secondary flex-center" onClick={() => navigate('/cashbook')}>
              <Eye size={16} /> Ledger
            </button>
          </div>
          
          <div className="dashboard-ledger-list">
            {cashEntries.slice(0, 4).map(entry => (
              <div key={entry.id} className="ledger-row flex-between">
                <div className="ledger-item-info">
                  <h4>{entry.category}</h4>
                  <p className="text-muted">{entry.description}</p>
                </div>
                <div className={`ledger-item-amount ${entry.type === 'expense' ? 'expense-color' : 'income-color'}`}>
                  {entry.type === 'expense' ? '-' : '+'}₹{entry.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .dashboard-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        /* Metrics */
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 140px;
        }

        .metric-label {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-icon {
          width: 32px;
          height: 32px;
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
        }

        .metric-val {
          font-size: 2.25rem;
          font-weight: 800;
          font-family: var(--font-heading);
          line-height: 1;
          margin-top: 0.5rem;
        }

        .metric-sub {
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        /* Charts Section */
        .dashboard-charts-layout {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .chart-large-card {
          background-color: var(--bg-primary);
          padding: 2rem;
        }

        .chart-header {
          margin-bottom: 2rem;
        }

        .chart-header h3 {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .chart-header p {
          font-size: 0.85rem;
        }

        /* AI Recommendation Ticker banner style */
        .ticker-card {
          background-color: var(--color-light-green);
          border: 1px solid rgba(22, 163, 74, 0.2);
          border-radius: var(--radius-md);
          padding: 0.75rem 1.5rem;
          gap: 1.5rem;
          overflow: hidden;
        }

        html[data-theme='dark'] .ticker-card {
          background-color: rgba(22, 163, 74, 0.1);
        }

        .ticker-badge {
          background-color: var(--color-primary);
          color: #FFFFFF;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .ticker-track {
          flex-grow: 1;
        }

        .ticker-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-primary-hover);
          line-height: 1.4;
        }

        /* Content Split sections */
        .dashboard-content-split {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .split-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .card-header p {
          font-size: 0.8rem;
        }

        /* Weather farm details rows */
        .weather-farm-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .weather-farm-row {
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .weather-farm-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .weather-farm-info h4 {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .weather-farm-metrics {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .weather-temp-badge {
          color: var(--color-primary);
        }

        .weather-desc-badge {
          background-color: var(--bg-tertiary);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
        }

        .weather-rain-badge {
          color: #2563EB;
        }

        /* Dashboard alerts */
        .dashboard-alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dashboard-alert-item {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border-left: 4px solid var(--border-color);
          background-color: var(--bg-secondary);
          gap: 1rem;
        }

        .dashboard-alert-item.severity-info {
          border-left-color: #2563EB;
        }
        .dashboard-alert-item.severity-warning {
          border-left-color: var(--color-warning);
        }
        .dashboard-alert-item.severity-danger {
          border-left-color: var(--color-danger);
        }

        .alert-body {
          flex-grow: 1;
        }

        .alert-meta {
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.15rem;
        }

        .alert-farm {
          color: var(--color-primary);
        }

        .alert-date {
          color: var(--text-muted);
        }

        .alert-msg {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .alert-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        /* Ledger Row Styles */
        .dashboard-ledger-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ledger-row {
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .ledger-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .ledger-item-info h4 {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .ledger-item-info p {
          font-size: 0.75rem;
          margin-top: 0.1rem;
        }

        .ledger-item-amount {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
        }

        .expense-color { color: var(--color-danger); }
        .income-color { color: var(--color-success); }

        .small-loading-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border-color);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          display: inline-block;
          animation: spin-small 1s linear infinite;
        }
        @keyframes spin-small {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .metrics-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .dashboard-content-split {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

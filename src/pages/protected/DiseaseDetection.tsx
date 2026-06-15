import React, { useState } from 'react';
import { useFarms } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { analyzeCropDisease } from '../../services/gemini';
import { motion } from 'framer-motion';
import { Camera, ShieldAlert, CheckCircle, RefreshCw, Send, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DiseaseDetection: React.FC = () => {
  const { farms, addDiseaseReport, addCommunityPost } = useFarms();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [selectedCropType, setSelectedCropType] = useState<string>(farms[0]?.crop || 'Cotton');
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  // Preloaded crop sample leaf photos for instant demo scanning
  const demoSamples = [
    { crop: 'Cotton', name: 'Cotton Leaf Blight', img: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=256' },
    { crop: 'Paddy', name: 'Rice Blast', img: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=256' },
    { crop: 'Maize', name: 'Maize Turcicum Blight', img: 'https://images.unsplash.com/photo-1526344966-89049886b28d?auto=format&fit=crop&q=80&w=256' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setReport(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sampleImg: string) => {
    setImage(sampleImg);
    setReport(null);
  };

  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    
    const cropType = selectedCropType;

    try {
      const result = await analyzeCropDisease(image, cropType, language);
      setReport(result);
      
      // Save report in context logs if farm is linked
      if (selectedFarmId) {
        addDiseaseReport({
          farmId: selectedFarmId,
          cropType,
          diseaseName: result.diseaseName,
          confidence: result.confidence,
          description: result.description,
          prevention: result.prevention,
          treatment: result.treatment,
          fertilizer: result.fertilizer,
          imageUrl: image
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleAskCommunity = () => {
    if (!report || !image) return;
    
    // Auto post to feed
    addCommunityPost({
      author: 'Abhiram Pulkam',
      authorRole: 'Farmer • Karimnagar Plot',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=128',
      content: `I scanned my ${report.diseaseName} crop today using KisanAI. The system detected "${report.diseaseName}" with ${report.confidence}% confidence. Has anyone else treated this in Telangana? Recommended copper fungicide.`,
      imageUrl: image,
      category: 'questions'
    });

    alert('Published to Community Forum! Farmers and experts can now leave comments on your case.');
    navigate('/community');
  };

  const handleAskAi = () => {
    if (!report) return;
    navigate('/copilot', { state: { query: `Tell me more about treating ${report.diseaseName} on cotton/paddy crops.` } });
  };  const renderSafeString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      if (val.organic || val.chemical) {
        return [
          val.organic ? `Organic: ${val.organic}` : '',
          val.chemical ? `Chemical: ${val.chemical}` : ''
        ].filter(Boolean).join('\n');
      }
      try {
        return Object.entries(val)
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n');
      } catch {
        return JSON.stringify(val);
      }
    }
    return String(val);
  };

  return (
    <div className="disease-page-layout">
      <div className="disease-header glass-card">
        <h2>{t('disease.title')}</h2>
        <p className="text-muted">Take a photo of crop leaf spots to diagnose diseases instantly using computer vision.</p>
      </div>

      <main className="disease-scan-grid">
        {/* Left pane: Upload Terminals */}
        <section className="scan-control-pane glass-card">
          <div className="form-group">
            <label className="form-label">Select Farm Plot to Scan (Optional):</label>
            <select 
              className="form-input" 
              value={selectedFarmId} 
              onChange={(e) => {
                const val = e.target.value;
                setSelectedFarmId(val);
                const targetFarm = farms.find(f => f.id === val);
                if (targetFarm) {
                  setSelectedCropType(targetFarm.crop);
                }
              }}
            >
              <option value="">None (Quick Scan)</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.crop})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Crop Type:</label>
            <select 
              className="form-input" 
              value={selectedCropType} 
              onChange={(e) => setSelectedCropType(e.target.value)}
            >
              <option value="Cotton">Cotton (పత్తి / कपास)</option>
              <option value="Paddy">Paddy (Rice) (వరి / धान)</option>
              <option value="Maize">Maize (Corn) (మొక్కజొన్న / मक्का)</option>
              <option value="Wheat">Wheat (గోధుమ / गेहूं)</option>
              <option value="Sugarcane">Sugarcane (చెరకు / गन्ना)</option>
              <option value="Groundnut">Groundnut (వేరుశనగ / मूंगфली)</option>
              <option value="Turmeric">Turmeric (పసుపు / हल्दी)</option>
              <option value="Chilli">Chilli (మిరప / मिर्च)</option>
              <option value="Pulses">Pulses (పప్పుధాన్యాలు / दलहन)</option>
              <option value="Vegetables">Vegetables (కూరగాయలు / सब्जियां)</option>
            </select>
          </div>

          {/* Leaf photo drag box */}
          <div className="upload-drag-box relative flex-center">
            {image ? (
              <div className="uploaded-preview-container">
                <img src={image} alt="Crop Leaf Scan target" className="scanned-image-preview" />
                <button className="btn btn-secondary clear-image-btn" onClick={() => { setImage(null); setReport(null); }}>
                  <RefreshCw size={14} /> Clear
                </button>
              </div>
            ) : (
              <label className="upload-click-label text-center flex-column flex-center">
                <Camera size={36} className="camera-icon-muted" />
                <span>{t('disease.dragDrop')}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden-file-input" 
                  onChange={handleImageUpload} 
                />
              </label>
            )}
          </div>

          {/* Demo samples for test */}
          {!image && (
            <div className="demo-samples-box">
              <p className="samples-title text-muted">Or test with these leaf samples:</p>
              <div className="samples-row flex-between">
                {demoSamples.map((s, idx) => (
                  <button 
                    key={idx} 
                    className="sample-mini-card text-center"
                    onClick={() => handleSelectSample(s.img)}
                  >
                    <img src={s.img} alt={s.name} />
                    <span>{s.crop} Leaf</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary scan-action-btn"
            disabled={!image || scanning}
            onClick={handleScan}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {scanning ? (
              <span className="flex-center" style={{ gap: '0.5rem' }}>
                <RefreshCw size={16} className="spin-icon" /> {t('disease.scanning')}
              </span>
            ) : (
              <span className="flex-center" style={{ gap: '0.5rem' }}>
                <Sparkles size={16} /> Scan Crop Health
              </span>
            )}
          </button>
        </section>

        {/* Right pane: Diagnosis analysis */}
        <section className="scan-results-pane">
          {scanning ? (
            <div className="scanner-skeleton-box glass-card flex-column flex-center">
              <div className="scanner-line"></div>
              <p className="text-muted">Analyzing cell tissue pigmentation...</p>
            </div>
          ) : report ? (
            <motion.div 
              className="results-report-card glass-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="results-header flex-between">
                <div>
                  <span className="badge badge-danger flex-center" style={{ gap: '0.25rem' }}>
                    <ShieldAlert size={14} /> {t('disease.detected')}
                  </span>
                  <h2 className="disease-name-label">{report.diseaseName}</h2>
                  <a 
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(report.diseaseName + ' ' + selectedCropType + ' disease symptoms treatment medicine')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm flex-center"
                    style={{ gap: '0.35rem', marginTop: '0.5rem', display: 'inline-flex', fontSize: '0.8rem', padding: '0.35rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)' }}
                  >
                    🖼️ View Symptoms & Medicine Photos
                  </a>
                </div>
                <div className="confidence-meter text-center">
                  <span className="confidence-val">{report.confidence}%</span>
                  <span className="confidence-lbl">{t('disease.confidence')}</span>
                </div>
              </div>

              <div className="report-body-paragraphs">
                <div className="paragraph-block">
                  <h4>Information</h4>
                  <p style={{ whiteSpace: 'pre-line' }}>{renderSafeString(report.description)}</p>
                </div>

                <div className="paragraph-block">
                  <h4>{t('disease.treatment')}</h4>
                  <p className="highlighted-treatment" style={{ whiteSpace: 'pre-line' }}>{renderSafeString(report.treatment)}</p>
                </div>

                <div className="paragraph-block-grid">
                  <div className="paragraph-block">
                    <h4>{t('disease.prevention')}</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{renderSafeString(report.prevention)}</p>
                  </div>
                  <div className="paragraph-block">
                    <h4>{t('disease.fertilizer')}</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{renderSafeString(report.fertilizer)}</p>
                  </div>
                </div>
              </div>

              <div className="results-actions-row flex-between">
                <button className="btn btn-outline flex-center" onClick={handleAskAi}>
                  <Sparkles size={16} /> {t('disease.askAi')}
                </button>
                <button className="btn btn-secondary flex-center" onClick={handleAskCommunity}>
                  <Users size={16} /> {t('disease.askCommunity')}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="results-empty-card glass-card flex-column flex-center text-center">
              <div className="results-empty-icon">✓</div>
              <h3>No Crop Diagnostic Reports</h3>
              <p className="text-muted">Upload a leaf photo or pick a sample card on the left to start AI crop health analysis.</p>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .disease-page-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .disease-header {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .disease-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .disease-scan-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 2rem;
        }

        .scan-control-pane {
          background-color: var(--bg-primary);
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: fit-content;
        }

        /* Drag boxes */
        .upload-drag-box {
          border: 2.5px dashed var(--border-color);
          border-radius: var(--radius-md);
          height: 200px;
          cursor: pointer;
          background-color: var(--bg-secondary);
          transition: border-color var(--transition-fast);
          overflow: hidden;
        }

        .upload-drag-box:hover {
          border-color: var(--color-primary);
        }

        .camera-icon-muted {
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .upload-click-label {
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .upload-click-label span {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .hidden-file-input {
          display: none;
        }

        .uploaded-preview-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .scanned-image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .clear-image-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: rgba(15, 23, 42, 0.85);
          color: #f8fafc;
          padding: 0.35rem 0.65rem;
          font-size: 0.75rem;
          border: none;
        }

        .clear-image-btn:hover {
          background-color: #0f172a;
        }

        /* Sample leaf photo picker */
        .demo-samples-box {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .samples-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .samples-row {
          gap: 0.75rem;
        }

        .sample-mini-card {
          flex: 1;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 0.5rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .sample-mini-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        .sample-mini-card img {
          width: 100%;
          height: 50px;
          border-radius: var(--radius-sm);
          object-fit: cover;
        }

        .sample-mini-card span {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        /* Results output */
        .results-report-card {
          background-color: var(--bg-primary);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .results-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
        }

        .disease-name-label {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 0.25rem;
        }

        .confidence-meter {
          display: flex;
          flex-direction: column;
          justify-content: center;
          background-color: var(--color-light-green);
          color: var(--color-primary);
          padding: 0.4rem 1rem;
          border-radius: var(--radius-md);
        }

        html[data-theme='dark'] .confidence-meter {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .confidence-val {
          font-size: 1.35rem;
          font-weight: 800;
          line-height: 1;
        }

        .confidence-lbl {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .report-body-paragraphs {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .paragraph-block h4 {
          font-size: 0.9rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .paragraph-block p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .highlighted-treatment {
          background-color: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--color-primary-hover);
          font-weight: 600;
        }

        .paragraph-block-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .results-actions-row {
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }

        /* Empty states */
        .results-empty-card {
          background-color: var(--bg-primary);
          padding: 4rem 2rem;
          height: 100%;
        }

        .results-empty-icon {
          font-size: 3rem;
          color: var(--color-primary);
          width: 70px;
          height: 70px;
          background-color: var(--color-light-green);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .results-empty-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .results-empty-card p {
          font-size: 0.95rem;
          max-width: 380px;
          margin-top: 0.5rem;
        }

        /* Scanner line animation */
        .scanner-skeleton-box {
          background-color: var(--bg-primary);
          height: 100%;
          min-height: 350px;
          position: relative;
          overflow: hidden;
        }

        .scanner-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background-color: var(--color-primary);
          box-shadow: 0 0 12px var(--color-primary);
          animation: scannerSlide 2s infinite ease-in-out;
        }

        @keyframes scannerSlide {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }

        .spin-icon {
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .disease-scan-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

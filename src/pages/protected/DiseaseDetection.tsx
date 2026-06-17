import React, { useState } from 'react';
import { useFarms } from '../../context/FarmContext';
import type { DiseaseReport } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { analyzeCropDisease } from '../../services/gemini';
import { motion } from 'framer-motion';
import { Camera, ShieldAlert, CheckCircle, RefreshCw, Send, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Suggested fertilizers brand matcher
const getSuggestedProducts = (crop: string, disease: string, treatmentText: string = '', fertilizerText: string = '') => {
  const text = (treatmentText + ' ' + fertilizerText + ' ' + disease + ' ' + crop).toLowerCase();
  
  const productsList = [
    {
      name: 'Blitox (Copper Oxychloride 50% WP)',
      type: 'Chemical Fungicide',
      description: 'Broad-spectrum contact fungicide, highly effective against leaf blights, spots, and downy mildew.',
      price: '₹280 / 500g',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=256',
      searchQuery: 'Blitox Copper Oxychloride 50 WP packing',
      keywords: ['copper', 'blitox', 'blight', 'spot', 'downy', 'fungicide']
    },
    {
      name: 'Saaf Fungicide (Carbendazim 12% + Mancozeb 63% WP)',
      type: 'Systemic & Contact Fungicide',
      description: 'Trusted combination for controlling blast, leaf spots, and rust in paddy and cotton.',
      price: '₹340 / 500g',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=256',
      searchQuery: 'UPL Saaf Fungicide packing',
      keywords: ['saaf', 'mancozeb', 'carbendazim', 'blast', 'rust', 'fungicide']
    },
    {
      name: 'Econeem (Pure Neem Oil 10,000 PPM)',
      type: 'Organic Bio-Pesticide',
      description: 'Natural pest controller preventing whiteflies, aphids, and sucking pests on crop leaves.',
      price: '₹420 / 1L',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=256',
      searchQuery: 'Econeem Neem Oil agriculture bottle',
      keywords: ['neem', 'oil', 'organic', 'insecticide', 'pesticide', 'whitefly', 'aphid', 'bug']
    },
    {
      name: 'IFFCO NPK 19-19-19',
      type: 'Soluble NPK Fertilizer',
      description: 'Promotes balanced growth, vegetative development, and overall crop vigor.',
      price: '₹150 / 1kg',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=256',
      searchQuery: 'IFFCO NPK 19-19-19 fertilizer bag',
      keywords: ['npk', 'fertilizer', 'nitrogen', 'phosphorus', 'potassium', 'growth', 'nutrient']
    },
    {
      name: 'Trichoderma Viride Bio-Fungicide',
      type: 'Organic Bio-Fungicide',
      description: 'Eco-friendly bio-fungicide protecting roots and soil from fungal attack.',
      price: '₹180 / 1kg',
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=256',
      searchQuery: 'Trichoderma Viride agricultural packet',
      keywords: ['trichoderma', 'organic', 'fungicide', 'soil', 'bio', 'rot', 'wilt']
    },
    {
      name: 'Streptocycline (Streptomycin + Tetracycline)',
      type: 'Antibacterial Medicine',
      description: 'Antibacterial powder for leaf spots, black arm, and bacterial canker diseases.',
      price: '₹45 / 6g',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=256',
      searchQuery: 'Streptocycline packet agriculture',
      keywords: ['streptocycline', 'bacterial', 'canker', 'black arm', 'antibiotic']
    }
  ];

  const scored = productsList.map(p => {
    let score = 0;
    p.keywords.forEach(kw => {
      if (text.includes(kw)) score += 1;
    });
    if (crop.toLowerCase() === 'cotton' && p.name.includes('Saaf')) score += 0.5;
    if (crop.toLowerCase() === 'paddy' && p.name.includes('NPK')) score += 0.5;
    return { ...p, score };
  });

  const matched = scored.filter(p => p.score > 0).sort((a, b) => b.score - a.score);
  return matched.length > 0 ? matched.slice(0, 3) : scored.slice(0, 3);
};

export const DiseaseDetection: React.FC = () => {
  const { farms, diseaseReports = [], addDiseaseReport, addCommunityPost } = useFarms();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [selectedCropType, setSelectedCropType] = useState<string>(farms[0]?.crop || 'Cotton');
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'history'>('diagnostics');

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
    setActiveTab('diagnostics');
    
    const cropType = selectedCropType;

    try {
      const result = await analyzeCropDisease(image, cropType, language);
      setReport(result);
      
      // Save report in context logs if farm is linked
      if (selectedFarmId) {
        await addDiseaseReport({
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

  const handleSelectHistoryItem = (item: DiseaseReport) => {
    setReport(item);
    setImage(item.imageUrl);
    setSelectedCropType(item.cropType);
    setSelectedFarmId(item.farmId || '');
    setActiveTab('diagnostics');
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

        {/* Right pane: Diagnosis analysis & History tabs */}
        <section className="scan-results-pane">
          <div className="tab-header flex" style={{ gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', width: '100%' }}>
            <button 
              className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagnostics')}
              style={{
                padding: '0.75rem 1rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderBottom: activeTab === 'diagnostics' ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: activeTab === 'diagnostics' ? 'var(--color-primary)' : 'var(--text-muted)',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              🔍 Diagnostics
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              style={{
                padding: '0.75rem 1rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderBottom: activeTab === 'history' ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--text-muted)',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              📜 Scan History ({diseaseReports.length})
            </button>
          </div>

          {activeTab === 'diagnostics' ? (
            scanning ? (
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

                {/* Suggested Fertilizers Visual Product Cards Section */}
                <div className="fertilizer-recommendations-section" style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💊 Recommended Indian Remedies & Fertilizers
                  </h4>
                  <div className="fertilizer-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                    {getSuggestedProducts(selectedCropType, report.diseaseName, renderSafeString(report.treatment), renderSafeString(report.fertilizer)).map((prod, pIdx) => (
                      <div key={pIdx} className="fertilizer-product-card glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', transition: 'all var(--transition-fast)' }}>
                        <div className="product-image-wrapper" style={{ height: '120px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
                          <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span className="badge badge-info" style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>{prod.type}</span>
                        </div>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>{prod.name}</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, flex: 1, lineBreak: 'anywhere' }}>{prod.description}</p>
                        <div className="product-meta flex-between" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <span style={{ color: 'var(--color-primary)' }}>{prod.price}</span>
                          <span style={{ color: '#eab308' }}>★ {prod.rating}</span>
                        </div>
                        <a 
                          href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(prod.searchQuery)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm text-center flex-center"
                          style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem', textDecoration: 'none', gap: '0.25rem' }}
                        >
                          🖼️ Google Images Lookup
                        </a>
                      </div>
                    ))}
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
            )
          ) : (
            <div className="history-tab-pane glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>All Scanned Reports</h3>
              {diseaseReports.length === 0 ? (
                <div className="text-center" style={{ padding: '3rem 1rem' }}>
                  <p className="text-muted" style={{ margin: 0 }}>No previous scans recorded. Link a farm plot and scan crop leaves to save report logs.</p>
                </div>
              ) : (
                <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {[...diseaseReports].reverse().map((item) => {
                    const farmName = farms.find(f => f.id === item.farmId)?.name || 'Quick Scan';
                    return (
                      <div 
                        key={item.id} 
                        className="history-item flex-between" 
                        onClick={() => handleSelectHistoryItem(item)}
                        style={{ 
                          padding: '0.75rem', 
                          backgroundColor: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-md)', 
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
                          <img 
                            src={item.imageUrl} 
                            alt={item.diseaseName} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                          />
                          <div>
                            <h5 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{item.diseaseName}</h5>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {item.cropType} • {farmName} • {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-column" style={{ alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                            {item.confidence}% match
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>Click to View Details →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

        .history-item {
          transition: all var(--transition-fast);
        }
        .history-item:hover {
          border-color: var(--color-primary) !important;
          background-color: var(--color-light-green) !important;
          transform: translateX(3px);
        }
        html[data-theme='dark'] .history-item:hover {
          background-color: rgba(22, 163, 74, 0.1) !important;
        }

        .fertilizer-product-card:hover {
          border-color: var(--color-primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 1024px) {
          .disease-scan-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .paragraph-block-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

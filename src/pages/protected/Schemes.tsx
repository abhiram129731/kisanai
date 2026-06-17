import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { Search, Award, ExternalLink, Filter, HelpCircle, Info } from 'lucide-react';

interface Scheme {
  id: string;
  title: string;
  category: string;
  targetCrop: string;
  description: string;
  link: string;
  state: string;
}

const DEFAULT_SCHEMES: Scheme[] = [
  {
    id: 'scheme-1',
    title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    category: 'Direct Income Support',
    targetCrop: 'All Crops',
    description: 'An initiative by the Government of India that provides up to ₹6,000 per year in three equal installments to small and marginal farmers.',
    link: 'https://pmkisan.gov.in/',
    state: 'Central'
  },
  {
    id: 'scheme-2',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'Crop Insurance',
    targetCrop: 'Food & Oilseed Crops',
    description: 'A government-sponsored crop insurance scheme that integrates multiple stakeholders to protect farmers from climate-related yield losses.',
    link: 'https://pmfby.gov.in/',
    state: 'Central'
  },
  {
    id: 'scheme-3',
    title: 'Rythu Bandhu Scheme',
    category: 'State Investment Support',
    targetCrop: 'All Crops',
    description: 'Telangana government investment support scheme providing ₹5,000 per acre per season directly to farmers for purchase of seeds, fertilizers, and inputs.',
    link: 'http://rythubandhu.telangana.gov.in/',
    state: 'Telangana'
  },
  {
    id: 'scheme-4',
    title: 'Krishak Bandhu Scheme',
    category: 'State Investment Support',
    targetCrop: 'All Crops',
    description: 'West Bengal government initiative providing financial assistance of up to ₹10,000 per year to farmers and ₹2 lakh term life insurance to families.',
    link: 'https://krishakbandhu.wb.gov.in/',
    state: 'West Bengal'
  },
  {
    id: 'scheme-5',
    title: 'YSR Rythu Bharosa',
    category: 'State Investment Support',
    targetCrop: 'All Crops',
    description: 'Andhra Pradesh government scheme providing financial assistance of ₹13,500 per year to farmer families, including tenant farmers.',
    link: 'https://ysrrythubharosa.ap.gov.in/',
    state: 'Andhra Pradesh'
  },
  {
    id: 'scheme-6',
    title: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)',
    category: 'Direct Income Support',
    targetCrop: 'All Crops',
    description: 'A voluntary and contributory pension scheme for small and marginal farmers providing a monthly pension of ₹3,000 after attaining 60 years of age.',
    link: 'https://maandhan.in/',
    state: 'Central'
  }
];

import { 
  SCHEMES_TRANSLATIONS, 
  CATEGORY_TRANSLATIONS, 
  PAGE_TRANSLATIONS 
} from './SchemesTranslations';
import type { LocalizedScheme } from './SchemesTranslations';

export const Schemes: React.FC = () => {
  const { language } = useLanguage();
  const activeLang = SCHEMES_TRANSLATIONS[language] ? language : 'en';

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  useEffect(() => {
    const saved = localStorage.getItem('kisan_managed_schemes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && !parsed[0].hasOwnProperty('state')) {
          localStorage.setItem('kisan_managed_schemes', JSON.stringify(DEFAULT_SCHEMES));
          setSchemes(DEFAULT_SCHEMES);
        } else {
          setSchemes(parsed);
        }
      } catch (e) {
        localStorage.setItem('kisan_managed_schemes', JSON.stringify(DEFAULT_SCHEMES));
        setSchemes(DEFAULT_SCHEMES);
      }
    } else {
      localStorage.setItem('kisan_managed_schemes', JSON.stringify(DEFAULT_SCHEMES));
      setSchemes(DEFAULT_SCHEMES);
    }
  }, []);

  const getSchemeProp = (schemeId: string, prop: keyof LocalizedScheme, fallback: string): string => {
    const localized = SCHEMES_TRANSLATIONS[activeLang]?.[schemeId];
    return localized ? localized[prop] : fallback;
  };

  const categories = useMemo(() => {
    const cats = ['All'];
    schemes.forEach(s => {
      const catVal = getSchemeProp(s.id, 'category', s.category);
      if (!cats.includes(catVal)) {
        cats.push(catVal);
      }
    });
    return cats;
  }, [schemes, activeLang]);

  const states = useMemo(() => {
    const st = ['All'];
    schemes.forEach(s => {
      const stateVal = s.state || 'Central';
      if (!st.includes(stateVal)) {
        st.push(stateVal);
      }
    });
    return st;
  }, [schemes]);

  const filteredSchemes = useMemo(() => {
    return schemes.filter(s => {
      const title = getSchemeProp(s.id, 'title', s.title);
      const description = getSchemeProp(s.id, 'description', s.description);
      const targetCrop = getSchemeProp(s.id, 'targetCrop', s.targetCrop);
      const category = getSchemeProp(s.id, 'category', s.category);
      const stateVal = s.state || 'Central';

      const matchesSearch = 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        targetCrop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stateVal.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
      const matchesState = selectedState === 'All' || stateVal === selectedState;
      return matchesSearch && matchesCategory && matchesState;
    });
  }, [schemes, searchQuery, selectedCategory, selectedState, activeLang]);

  const getCategoryLabel = (cat: string) => {
    const mapping = CATEGORY_TRANSLATIONS[activeLang];
    return mapping ? mapping[cat] || cat : cat;
  };

  const pageText = PAGE_TRANSLATIONS[activeLang] || PAGE_TRANSLATIONS['en'];

  return (
    <div className="schemes-page-layout">
      {/* Page Header */}
      <div className="schemes-header glass-card">
        <div className="flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start', color: 'var(--color-primary)' }}>
          <Award size={28} />
          <h2>{pageText.title}</h2>
        </div>
        <p className="text-muted">{pageText.desc}</p>
      </div>

      {/* Filter and Search Section */}
      <div className="schemes-filter-bar glass-card flex-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <div className="flex-center" style={{ gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '550px', justifyContent: 'flex-start' }}>
          <div className="search-box-wrapper relative flex-center" style={{ flex: 1, minWidth: '220px' }}>
            <Search size={18} className="search-icon-muted" style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input search-input" 
              style={{ paddingLeft: '2.5rem', margin: 0, width: '100%' }}
              placeholder={pageText.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="state-select-wrapper flex-center" style={{ gap: '0.5rem' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              style={{ margin: 0, padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.85rem', width: '160px', height: '38px', cursor: 'pointer' }}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="All">All States (Central & State)</option>
              {states.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="categories-pill-row flex" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      <main className="schemes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredSchemes.length === 0 ? (
          <div className="empty-schemes-card glass-card text-center flex-column flex-center" style={{ gridColumn: '1 / -1', padding: '4rem 2rem', gap: '1rem' }}>
            <Award size={48} style={{ color: 'var(--text-muted)' }} />
            <h3>
              {activeLang === 'te' ? 'పథకాలు ఏవీ కనుగొనబడలేదు' 
               : activeLang === 'hi' ? 'कोई योजना नहीं मिली' 
               : activeLang === 'gu' ? 'કોઈ યોજનાઓ મળી નથી' 
               : activeLang === 'mr' ? 'कोणतीही योजना आढळली नाही' 
               : activeLang === 'ta' ? 'திட்டங்கள் எதுவும் காணப்படவில்லை' 
               : activeLang === 'kn' ? 'ಯಾವುದೇ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ' 
               : activeLang === 'bn' ? 'কোন প্রকল্প পাওয়া যায়নি' 
               : activeLang === 'pa' ? 'ਕੋਈ ਸਕੀਮ ਨਹੀਂ ਲੱਭੀ' 
               : activeLang === 'ml' ? 'പദ്ധതികളൊന്നും കണ്ടെത്തിയില്ല' 
               : 'No Schemes Found'}
            </h3>
            <p className="text-muted" style={{ maxWidth: '400px' }}>
              {activeLang === 'te' ? 'మీ శోధనకు సరిపోలే అధికారిక పథకాలు లేవు.' 
               : activeLang === 'hi' ? 'आपकी खोज से मेल खाने वाली कोई सरकारी योजना नहीं है।' 
               : activeLang === 'gu' ? 'તમારી શોધને અનુકૂળ કોઈ સરકારી યોજનાઓ મળી નથી.' 
               : activeLang === 'mr' ? 'तुमच्या शोधाशी जुळणारी कोणतीही योजना आढळली नाही.' 
               : activeLang === 'ta' ? 'உங்கள் தேடலுக்குப் பொருந்தக்கூடிய திட்டங்கள் எதுவும் இல்லை.' 
               : activeLang === 'kn' ? 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' 
               : activeLang === 'bn' ? 'আপনার অনুসন্ধানের সাথে মেলে এমন কোনো প্রকল্প খুঁজে পাওয়া যায়নি।' 
               : activeLang === 'pa' ? 'ਤੁਹਾਡੀ ਖੋਜ ਨਾਲ ਮੇਲ ਖਾਂਦੀ ਕੋਈ ਸਕੀਮ ਨਹੀਂ ਲੱਭੀ।' 
               : activeLang === 'ml' ? 'നിങ്ങൾ തിരഞ്ഞ ഫലങ്ങളൊന്നും കണ്ടെത്തിയില്ല.' 
               : 'Try adjusting your search query or switching categories.'}
            </p>
          </div>
        ) : (
          filteredSchemes.map((scheme, idx) => {
            const displayTitle = getSchemeProp(scheme.id, 'title', scheme.title);
            const displayDesc = getSchemeProp(scheme.id, 'description', scheme.description);
            const displayCategory = getSchemeProp(scheme.id, 'category', scheme.category);
            const displayTarget = getSchemeProp(scheme.id, 'targetCrop', scheme.targetCrop);
            const displayPortal = getSchemeProp(scheme.id, 'visitPortal', 'Visit Official Portal');

            return (
              <motion.div
                key={scheme.id}
                className="scheme-portal-card glass-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--transition-normal)'
                }}
              >
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div className="flex" style={{ gap: '0.25rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {getCategoryLabel(displayCategory)}
                    </span>
                    <span className="badge" style={{ 
                      fontSize: '0.7rem', 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                      color: 'rgb(59, 130, 246)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontWeight: 700 
                    }}>
                      📍 {scheme.state}
                    </span>
                  </div>
                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    🌾 {displayTarget}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)' }}>
                  {displayTitle}
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: 0 }}>
                  {displayDesc}
                </p>

                {scheme.link && (
                  <a
                    href={scheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary flex-center"
                    style={{
                      marginTop: '0.75rem',
                      textDecoration: 'none',
                      width: '100%',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      padding: '0.6rem'
                    }}
                  >
                    <span>{displayPortal}</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </motion.div>
            );
          })
        )}
      </main>

      <style>{`
        .schemes-page-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .schemes-header {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .schemes-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .schemes-filter-bar {
          background-color: var(--bg-primary);
          padding: 1rem 1.5rem;
        }

        .scheme-portal-card:hover {
          transform: translateY(-4px);
          border-color: var(--color-primary) !important;
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.08);
        }

        html[data-theme='dark'] .scheme-portal-card:hover {
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.15);
        }
      `}</style>
    </div>
  );
};

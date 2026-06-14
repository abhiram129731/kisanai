import React, { useState, useMemo } from 'react';
import { useFarms } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Printer, Download, BarChart2, Calendar, Sprout } from 'lucide-react';

export const Reports: React.FC = () => {
  const { farms, cashEntries, diseaseReports } = useFarms();
  const { t } = useLanguage();

  const [selectedReportType, setSelectedReportType] = useState<'summary' | 'finance' | 'disease'>('summary');
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');

  const activeFarm = useMemo(() => {
    return farms.find(f => f.id === selectedFarmId) || farms[0] || null;
  }, [farms, selectedFarmId]);

  // Compute stats for reports
  const reportStats = useMemo(() => {
    if (!activeFarm) return { income: 0, expense: 0, net: 0, scansCount: 0 };
    
    let income = 0;
    let expense = 0;
    cashEntries.forEach(e => {
      if (e.farmId === activeFarm.id) {
        if (e.type === 'income') income += e.amount;
        else expense += e.amount;
      }
    });

    const scansCount = diseaseReports.filter(r => r.farmId === activeFarm.id).length;

    return {
      income,
      expense,
      net: income - expense,
      scansCount
    };
  }, [activeFarm, cashEntries, diseaseReports]);

  const handlePrint = () => {
    window.print();
  };

  const renderSafeString = (val: any): string => {
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

  if (farms.length === 0) {
    return (
      <div className="flex-center" style={{ height: '70vh' }}>
        <p className="text-muted">Please add a farm plot first to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="reports-page-layout">
      {/* Selector Card */}
      <div className="reports-header-card glass-card flex-between no-print">
        <div>
          <h2>Platform Reports & PDF Center</h2>
          <p className="text-muted">Export verified agronomic records and balance sheets for banking applications</p>
        </div>
        <div className="reports-selectors flex-center" style={{ gap: '1rem' }}>
          <div className="farm-selector">
            <select 
              className="form-input" 
              value={selectedFarmId} 
              onChange={(e) => setSelectedFarmId(e.target.value)}
              style={{ width: '180px' }}
            >
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary flex-center" onClick={handlePrint}>
            <Printer size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Main split: Selector options vs printable document sheet */}
      <main className="reports-main-split">
        {/* Left Side: selectors */}
        <section className="reports-type-card glass-card no-print">
          <h3>Report Template</h3>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>Select which template to compile.</p>
          
          <div className="template-options-list">
            <button 
              className={`template-btn text-left flex-center ${selectedReportType === 'summary' ? 'active' : ''}`}
              onClick={() => setSelectedReportType('summary')}
            >
              <Sprout size={18} />
              <div>
                <h4>Farm Profile Summary</h4>
                <p>GPS boundaries, soil chemistry, and active crops details.</p>
              </div>
            </button>

            <button 
              className={`template-btn text-left flex-center ${selectedReportType === 'finance' ? 'active' : ''}`}
              onClick={() => setSelectedReportType('finance')}
            >
              <BarChart2 size={18} />
              <div>
                <h4>Profit & Loss Statement</h4>
                <p>Budget breakdowns, expense ledger entries, and net savings.</p>
              </div>
            </button>

            <button 
              className={`template-btn text-left flex-center ${selectedReportType === 'disease' ? 'active' : ''}`}
              onClick={() => setSelectedReportType('disease')}
            >
              <FileText size={18} />
              <div>
                <h4>Crop Disease Scan Logs</h4>
                <p>Computer vision tissue diagnosis logs and fertilizer plans.</p>
              </div>
            </button>
          </div>
        </section>

        {/* Right Side: Printable document sheet */}
        <section className="printable-report-sheet-wrapper">
          <div className="printable-document-sheet glass-card">
            {/* Header Branding */}
            <div className="print-branding-header flex-between">
              <div>
                <h1 className="print-logo">🌾 KisanAI</h1>
                <p className="print-tagline">AI-Powered Digital Farming Operating System</p>
              </div>
              <div className="print-doc-meta text-right">
                <h3>{selectedReportType === 'summary' ? 'FARM PROFILE REPORT' : selectedReportType === 'finance' ? 'PROFIT & LOSS STATEMENT' : 'CROP DIAGNOSTIC JOURNAL'}</h3>
                <span>Date compiled: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <hr className="print-divider" />

            {/* Farm general specifications section */}
            {activeFarm && (
              <div className="print-farm-specs flex-between">
                <div>
                  <h4>Farm Plot: <strong>{activeFarm.name}</strong></h4>
                  <span>Location: {activeFarm.location}</span>
                </div>
                <div className="text-right">
                  <h4>Crop Type: <strong>{activeFarm.crop}</strong></h4>
                  <span>Acreage: {activeFarm.area} Acres</span>
                </div>
              </div>
            )}

            <hr className="print-divider" />

            {/* Template dynamic contents router */}
            <div className="print-report-content">
              {/* Template 1: Summary */}
              {selectedReportType === 'summary' && activeFarm && (
                <div className="template-content-body flex-column" style={{ gap: '1.5rem' }}>
                  <div className="print-block">
                    <h3>Soil & Irrigation Configuration</h3>
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Registered Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Soil Type Profile</td>
                          <td>{activeFarm.soilType}</td>
                        </tr>
                        <tr>
                          <td>Irrigation Method</td>
                          <td>{activeFarm.irrigationMethod}</td>
                        </tr>
                        <tr>
                          <td>GPS Polygon Coordinates Count</td>
                          <td>{activeFarm.coordinates.length} points linked</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="print-block">
                    <h3>Farm Chronological Timeline Milestones</h3>
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Action Milestone Description</th>
                          <th>Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeFarm.timeline.map(e => (
                          <tr key={e.id}>
                            <td>{e.date}</td>
                            <td>{e.action}</td>
                            <td style={{ textTransform: 'capitalize' }}>{e.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Template 2: Financial P&L */}
              {selectedReportType === 'finance' && (
                <div className="template-content-body flex-column" style={{ gap: '1.5rem' }}>
                  <div className="print-block">
                    <h3>Financial Performance Summary</h3>
                    <table className="print-table font-bold">
                      <tbody>
                        <tr>
                          <td>Total Harvest & Subsidy Inflows</td>
                          <td className="income-text">₹{reportStats.income.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td>Total Crop Production Outflows</td>
                          <td className="expense-text">₹{reportStats.expense.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style={{ fontSize: '1.1rem', borderTop: '2px solid var(--border-color)' }}>
                          <td>Net Seasonal Profitability</td>
                          <td className={reportStats.net >= 0 ? 'income-text' : 'expense-text'}>
                            {reportStats.net >= 0 ? '+' : '-'}₹{Math.abs(reportStats.net).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="print-block">
                    <h3>Detailed Transaction Ledger</h3>
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashEntries.filter(e => e.farmId === selectedFarmId).map(entry => (
                          <tr key={entry.id}>
                            <td>{entry.date}</td>
                            <td>{entry.category}</td>
                            <td>{entry.description}</td>
                            <td className={entry.type === 'income' ? 'income-text' : 'expense-text'}>
                              {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Template 3: Disease Scans */}
              {selectedReportType === 'disease' && (
                <div className="template-content-body flex-column" style={{ gap: '1.5rem' }}>
                  <div className="print-block">
                    <h3>Foliar Diagnosis Register</h3>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Historical list of vision reports logged for this crop season.</p>
                    
                    {diseaseReports.filter(r => r.farmId === selectedFarmId).length === 0 ? (
                      <p className="text-center" style={{ padding: '2rem' }}>No disease logs recorded for this plot.</p>
                    ) : (
                      diseaseReports.filter(r => r.farmId === selectedFarmId).map(report => (
                        <div key={report.id} className="print-disease-entry-block flex-column" style={{ gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                          <div className="flex-between">
                            <h4>{report.diseaseName}</h4>
                            <span className="badge badge-success">Confidence: {report.confidence}%</span>
                          </div>
                          <p style={{ whiteSpace: 'pre-line' }}><strong>Description:</strong> {renderSafeString(report.description)}</p>
                          <p style={{ whiteSpace: 'pre-line' }}><strong>Treatment Prescription:</strong> {renderSafeString(report.treatment)}</p>
                          <p style={{ whiteSpace: 'pre-line' }}><strong>NPK adjustments:</strong> {renderSafeString(report.fertilizer)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Document Signature Sign-offs */}
            <div className="print-signature-section flex-between">
              <div className="sig-block text-center">
                <div className="sig-line"></div>
                <span>Founder: Abhiram Pulkam</span>
              </div>
              <div className="sig-block text-center">
                <div className="sig-line"></div>
                <span>Farmer Owner Sign-off</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .reports-page-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .reports-header-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .reports-header-card h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        /* Split layouts */
        .reports-main-split {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        .reports-type-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .reports-type-card h3 {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .template-options-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .template-btn {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          color: var(--text-primary);
        }

        .template-btn:hover {
          border-color: var(--text-muted);
        }

        .template-btn.active {
          border-color: var(--color-primary);
          background-color: var(--color-light-green);
        }

        html[data-theme='dark'] .template-btn.active {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .template-btn h4 {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .template-btn p {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
          line-height: 1.3;
        }

        /* Printable paper sheets details */
        .printable-report-sheet-wrapper {
          width: 100%;
        }

        .printable-document-sheet {
          background-color: #FFFFFF;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          box-shadow: var(--shadow-xl);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          min-height: 800px;
        }

        html[data-theme='dark'] .printable-document-sheet {
          background-color: #FFFFFF; /* Printable sheet remains white for physical compatibility */
          color: #1e293b;
          border-color: #e2e8f0;
        }

        .print-logo {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.5rem;
          color: #16a34a;
        }

        .print-tagline {
          font-size: 0.75rem;
          color: #64748b;
        }

        .print-doc-meta h3 {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.025em;
          color: #0f172a;
        }

        .print-doc-meta span {
          font-size: 0.75rem;
          color: #64748b;
        }

        .print-divider {
          border: none;
          border-top: 1px solid #cbd5e1;
        }

        .print-farm-specs h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .print-farm-specs span {
          font-size: 0.8rem;
          color: #64748b;
        }

        .print-report-content h3 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.75rem;
        }

        /* Printable Table styles */
        .print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .print-table th, .print-table td {
          border: 1px solid #e2e8f0;
          padding: 0.6rem 0.8rem;
          text-align: left;
        }

        .print-table th {
          background-color: #f8fafc;
          font-weight: 700;
          color: #334155;
        }

        .print-table td {
          color: #334155;
        }

        .print-table.font-bold td {
          font-weight: 700;
        }

        .income-text { color: #16a34a; }
        .expense-text { color: #ef4444; }

        /* Document signature block */
        .print-signature-section {
          margin-top: auto;
          padding-top: 3rem;
        }

        .sig-block {
          width: 180px;
        }

        .sig-line {
          border-top: 1.5px solid #94a3b8;
          margin-bottom: 0.4rem;
        }

        .sig-block span {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }

        /* PRINT MEDIA LAYOUT STYLES - CRITICAL FOR CLEAN EXPORT */
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-document-sheet, .printable-document-sheet * {
            visibility: visible;
          }
          .printable-document-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }

        @media (max-width: 1024px) {
          .reports-main-split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

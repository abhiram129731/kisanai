import React, { useState, useMemo } from 'react';
import { useFarms } from '../../context/FarmContext';
import type { CashEntry } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownRight, Search, Trash2, ShieldAlert, Sparkles } from 'lucide-react';

export const Cashbook: React.FC = () => {
  const { cashEntries, addCashEntry, deleteCashEntry, farms } = useFarms();
  const { language, t } = useLanguage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');

  // New Transaction Form State
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [category, setCategory] = useState('Seeds');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  const expenseCategories = ['Seeds', 'Fertilizer', 'Pesticides', 'Labour', 'Fuel', 'Machinery', 'Irrigation', 'Miscellaneous'];
  const incomeCategories = ['Crop Sales', 'Subsidies', 'Dairy Income', 'Other Income'];

  // Handle modal trigger
  const handleOpenModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setCategory(type === 'expense' ? 'Seeds' : 'Crop Sales');
    setShowAddModal(true);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !selectedFarmId) return;

    addCashEntry({
      farmId: selectedFarmId,
      type: modalType,
      category,
      amount,
      date,
      description
    });

    setAmount(0);
    setDescription('');
    setShowAddModal(false);
  };

  // Compute Balances
  const balanceTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    cashEntries.forEach(entry => {
      if (entry.type === 'income') income += entry.amount;
      else expense += entry.amount;
    });
    return {
      income,
      expense,
      net: income - expense
    };
  }, [cashEntries]);

  // Compute AI Financial Insights
  const aiFinancialInsights = useMemo(() => {
    // 1. Calculate fertilizer share of total expenses
    const totalExp = balanceTotals.expense;
    let fertExp = 0;
    cashEntries.forEach(e => {
      if (e.type === 'expense' && e.category === 'Fertilizer') {
        fertExp += e.amount;
      }
    });

    const fertShare = totalExp > 0 ? (fertExp / totalExp) * 100 : 0;
    const insights = [];

    if (fertShare > 25) {
      insights.push(`Fertilizer expenses represent ${Math.round(fertShare)}% of your budget. Consider local organic leaf manures to reduce costs by up to 15%.`);
    } else if (fertExp > 0) {
      insights.push('Fertilizer expenses are within optimal bounds. Maintain current soil nutrition management plan.');
    }

    // 2. Expected seasonal margins
    const targetFarm = farms[0];
    if (targetFarm) {
      const estimatedRevenue = targetFarm.area * (targetFarm.crop === 'Cotton' ? 8 : 18) * 7500; // Estimated yield * price
      const estimatedExpenses = balanceTotals.expense;
      const margin = estimatedRevenue - estimatedExpenses;
      insights.push(`Expected seasonal profit estimate: ₹${margin.toLocaleString('en-IN')} based on active crop acreage.`);
    }

    return insights;
  }, [cashEntries, farms, balanceTotals]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return cashEntries.filter(entry => {
      const matchesSearch = 
        entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [cashEntries, searchQuery]);

  // Compute Expense category distributions for Recharts PieChart
  const expenseChartData = useMemo(() => {
    const map: Record<string, number> = {};
    cashEntries.forEach(e => {
      if (e.type === 'expense') {
        map[e.category] = (map[e.category] || 0) + e.amount;
      }
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    }));
  }, [cashEntries]);

  // Compute Farm-wise Profitability
  const farmProfitability = useMemo(() => {
    const farmMap: Record<string, { name: string; crop: string; income: number; expense: number }> = {};
    
    farms.forEach(farm => {
      farmMap[farm.id] = {
        name: farm.name,
        crop: farm.crop,
        income: 0,
        expense: 0
      };
    });

    let unassignedIncome = 0;
    let unassignedExpense = 0;

    cashEntries.forEach(entry => {
      if (entry.farmId && farmMap[entry.farmId]) {
        if (entry.type === 'income') {
          farmMap[entry.farmId].income += entry.amount;
        } else {
          farmMap[entry.farmId].expense += entry.amount;
        }
      } else {
        if (entry.type === 'income') {
          unassignedIncome += entry.amount;
        } else {
          unassignedExpense += entry.amount;
        }
      }
    });

    const rows = Object.entries(farmMap).map(([id, data]) => ({
      id,
      name: data.name,
      crop: data.crop,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense
    }));

    if (unassignedIncome > 0 || unassignedExpense > 0) {
      rows.push({
        id: 'unassigned',
        name: t('cash.unassigned'),
        crop: '-',
        income: unassignedIncome,
        expense: unassignedExpense,
        net: unassignedIncome - unassignedExpense
      });
    }

    return rows;
  }, [farms, cashEntries, t]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];

  return (
    <div className="cashbook-page-layout">
      {/* Title Header */}
      <div className="cashbook-header-card glass-card flex-between">
        <div>
          <h2>Farm Cashbook Ledger</h2>
          <p className="text-muted">Track crop budgets, fertilizer payouts, and seasonal harvest sales</p>
        </div>
        <div className="cash-action-buttons flex-center" style={{ gap: '0.75rem' }}>
          <button className="btn btn-primary flex-center" onClick={() => handleOpenModal('expense')}>
            <PlusCircle size={16} /> Add Expense
          </button>
          <button className="btn btn-secondary flex-center" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} onClick={() => handleOpenModal('income')}>
            <PlusCircle size={16} /> Add Income
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <section className="cash-totals-row">
        <div className="total-metric-card glass-card flex-between">
          <div>
            <span className="total-label">Total Inflow</span>
            <div className="total-value income-text">₹{balanceTotals.income.toLocaleString('en-IN')}</div>
          </div>
          <div className="total-icon-circle green flex-center"><ArrowUpRight size={20} /></div>
        </div>

        <div className="total-metric-card glass-card flex-between">
          <div>
            <span className="total-label">Total Outflow</span>
            <div className="total-value expense-text">₹{balanceTotals.expense.toLocaleString('en-IN')}</div>
          </div>
          <div className="total-icon-circle red flex-center"><ArrowDownRight size={20} /></div>
        </div>

        <div className="total-metric-card glass-card flex-between">
          <div>
            <span className="total-label">Net Balance</span>
            <div className="total-value text-gradient">₹{balanceTotals.net.toLocaleString('en-IN')}</div>
          </div>
          <div className="total-icon-circle blue flex-center"><Wallet size={20} /></div>
        </div>
      </section>

      {/* Main ledger grid */}
      <section className="cashbook-main-split">
        {/* Left pane: Transactions journal */}
        <div className="ledger-journal-card glass-card">
          <div className="journal-header flex-between">
            <h3>Transaction Ledger</h3>
            <div className="search-box-wrapper relative flex-center">
              <Search size={16} className="search-icon-muted" />
              <input 
                type="text" 
                className="form-input search-input" 
                placeholder="Search description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="transactions-list-scroll">
            {filteredEntries.length === 0 ? (
              <div className="empty-ledger text-center flex-column flex-center">
                <div className="empty-ledger-icon">📒</div>
                <h4>No transactions found</h4>
                <p className="text-muted">Expenses and income logged will show here.</p>
              </div>
            ) : (
              filteredEntries.map(entry => {
                const linkedFarm = farms.find(f => f.id === entry.farmId);
                return (
                  <div key={entry.id} className="transaction-item-row flex-between">
                    <div className="item-meta-info">
                      <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
                        <span className="item-category-tag">{entry.category}</span>
                        {linkedFarm && <span className="item-farm-tag">{linkedFarm.name.split(' ')[0]}</span>}
                      </div>
                      <p className="item-desc">{entry.description}</p>
                      <span className="item-date">{entry.date}</span>
                    </div>

                    <div className="item-action-amount flex-center" style={{ gap: '1.25rem' }}>
                      <span className={`item-price-tag ${entry.type === 'expense' ? 'expense-tag' : 'income-tag'}`}>
                        {entry.type === 'expense' ? '-' : '+'}₹{entry.amount.toLocaleString('en-IN')}
                      </span>
                      <button className="btn btn-secondary delete-item-btn" onClick={() => deleteCashEntry(entry.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Expense graphs and AI Insights */}
        <div className="ledger-analytics-pane flex-column" style={{ gap: '1.5rem' }}>
          {/* Pie Chart Card */}
          <div className="glass-card analytics-chart-card">
            <h3>Expense Category Breakdown</h3>
            
            <div className="chart-container relative" style={{ height: 160, marginTop: '1rem' }}>
              {expenseChartData.length === 0 ? (
                <div className="flex-center" style={{ height: '100%' }}>No expenses logged.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                      contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pie-legend">
              {expenseChartData.slice(0, 4).map((item, idx) => (
                <div key={idx} className="legend-item flex-center">
                  <span className="legend-dot" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="legend-name text-muted">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Farm-wise Profitability Breakdown Card */}
          <div className="glass-card profitability-card">
            <h3>{t('cash.farmProfitability')}</h3>
            <div className="profitability-table-wrapper" style={{ marginTop: '1.25rem' }}>
              <table className="profitability-table">
                <thead>
                  <tr>
                    <th>{t('cash.farmName')}</th>
                    <th>{t('cash.crop')}</th>
                    <th style={{ textAlign: 'right' }}>{t('cash.income')}</th>
                    <th style={{ textAlign: 'right' }}>{t('cash.expense')}</th>
                    <th style={{ textAlign: 'right' }}>{t('cash.netProfit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {farmProfitability.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                        {t('cash.empty')}
                      </td>
                    </tr>
                  ) : (
                    farmProfitability.map(row => (
                      <tr key={row.id}>
                        <td className="font-bold" style={{ whiteSpace: 'nowrap' }}>{row.name}</td>
                        <td className="text-muted" style={{ textTransform: 'capitalize' }}>{row.crop}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-success)', whiteSpace: 'nowrap' }}>₹{row.income.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-danger)', whiteSpace: 'nowrap' }}>₹{row.expense.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} className={row.net >= 0 ? 'income-text font-bold' : 'expense-text font-bold'}>
                          ₹{row.net.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="glass-card ai-insights-card">
            <div className="insights-header flex-center" style={{ gap: '0.5rem', color: 'var(--color-primary)' }}>
              <Sparkles size={18} />
              <h3>{t('cash.insights')}</h3>
            </div>
            <div className="insights-list-body">
              {aiFinancialInsights.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.9rem', padding: '0.5rem 0' }}>
                  No financial insights available yet. Please add transactions to generate real AI budgeting analysis.
                </p>
              ) : (
                aiFinancialInsights.map((insight, idx) => (
                  <div key={idx} className="insight-bullet flex-center">
                    <span className="bullet-indicator"></span>
                    <p>{insight}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Form Add Transaction modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-backdrop flex-center">
            <motion.div 
              className="modal-box glass-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Add {modalType === 'expense' ? 'Expense' : 'Income'} Log</h3>
              
              <form onSubmit={handleAddTransaction} className="modal-form flex-column" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Link to Farm Plot:</label>
                  <select 
                    className="form-input" 
                    value={selectedFarmId} 
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                  >
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {modalType === 'expense' ? 
                      expenseCategories.map(c => <option key={c} value={c}>{c}</option>) :
                      incomeCategories.map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    min={1} 
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Brief Description</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 5 bags of Nitrogen urea, forward contract sale..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="modal-actions flex-between" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Log</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .cashbook-page-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .cashbook-header-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .cashbook-header-card h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        /* Totals Grid */
        .cash-totals-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .total-metric-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          height: 110px;
        }

        .total-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .total-value {
          font-size: 2rem;
          font-weight: 800;
          font-family: var(--font-heading);
          line-height: 1;
          margin-top: 0.25rem;
        }

        .income-text { color: var(--color-success); }
        .expense-text { color: var(--color-danger); }

        .total-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
        }

        .total-icon-circle.green { background-color: var(--color-light-green); color: var(--color-primary); }
        .total-icon-circle.red { background-color: rgba(239, 68, 68, 0.1); color: var(--color-danger); }
        .total-icon-circle.blue { background-color: rgba(37, 99, 235, 0.1); color: #2563EB; }

        /* Main Split layout */
        .cashbook-main-split {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 2rem;
        }

        .ledger-journal-card {
          background-color: var(--bg-primary);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .journal-header h3 {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .search-input {
          padding-left: 2.25rem;
          width: 200px;
        }

        .search-icon-muted {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .transactions-list-scroll {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 480px;
          overflow-y: auto;
        }

        .transaction-item-row {
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
          transition: all var(--transition-fast);
        }

        .transaction-item-row:hover {
          border-color: var(--text-muted);
        }

        .item-meta-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.15rem;
        }

        .item-category-tag {
          font-size: 0.7rem;
          font-weight: 700;
          background-color: var(--bg-tertiary);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .item-farm-tag {
          font-size: 0.7rem;
          font-weight: 700;
          background-color: var(--color-light-green);
          color: var(--color-primary);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .item-desc {
          font-weight: 700;
          font-size: 0.95rem;
          margin-top: 0.15rem;
        }

        .item-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .item-price-tag {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.1rem;
        }

        .item-price-tag.expense-tag { color: var(--color-danger); }
        .item-price-tag.income-tag { color: var(--color-success); }

        .delete-item-btn {
          color: var(--color-danger);
          padding: 0.4rem;
        }

        .delete-item-btn:hover {
          background-color: rgba(239, 68, 68, 0.08);
        }

        /* Analytics / AI card list */
        .analytics-chart-card {
          background-color: var(--bg-primary);
        }

        .pie-legend {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .legend-item {
          gap: 0.5rem;
          justify-content: flex-start;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
        }

        .legend-name {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .ai-insights-card {
          background-color: var(--color-light-green);
          border: 1px solid rgba(22, 163, 74, 0.2);
        }

        html[data-theme='dark'] .ai-insights-card {
          background-color: rgba(22, 163, 74, 0.1);
        }

        .insights-list-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .insight-bullet {
          align-items: flex-start;
          gap: 0.75rem;
          justify-content: flex-start;
        }

        .bullet-indicator {
          width: 6px;
          height: 6px;
          background-color: var(--color-primary);
          border-radius: var(--radius-full);
          margin-top: 6px;
          flex-shrink: 0;
        }

        .insight-bullet p {
          font-size: 0.85rem;
          color: var(--color-primary-hover);
          font-weight: 600;
          line-height: 1.4;
        }

        /* Modal styling */
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(15, 23, 42, 0.4);
          z-index: 200;
          backdrop-filter: blur(4px);
        }

        .modal-box {
          background-color: var(--bg-primary);
          width: 100%;
          max-width: 440px;
          padding: 2rem;
        }

        .modal-box h3 {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .empty-ledger-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        /* Profitability Table Styles */
        .profitability-card {
          background-color: var(--bg-primary);
        }

        .profitability-table-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        .profitability-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .profitability-table th {
          text-align: left;
          padding: 0.75rem 0.5rem;
          border-bottom: 2px solid var(--border-color);
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        .profitability-table td {
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .profitability-table tr:last-child td {
          border-bottom: none;
        }
        
        .font-bold {
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .cashbook-main-split {
            grid-template-columns: 1fr;
          }
          .cash-totals-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

// src/pages/portals/BursarDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useBursarDashboard } from '../../api/dashboard';
import { xaf } from '../../components/ui/formatters';
import './BursarDashboard.css';

/* ── Fallback data (mirrors screenshot) ── */
const FALLBACK = {
  todayCollection: { value: 1245000, trend: 12.8, spark: [4, 6, 5, 8, 7, 9, 11] },
  monthCollection: { value: 12450000, trend: 8.3, spark: [3, 5, 6, 5, 8, 9, 10] },
  outstanding: { value: 18760000, students: 1245, spark: [6, 7, 6, 8, 7, 8, 9] },
  revenueYtd: { value: 98450000, trend: 15.7, spark: [4, 5, 7, 6, 9, 8, 12] },

  session: { date: 'May 22, 2026', year: '2026/2027', term: 'Term II' },

  collectionOverview: {
    total: 12450000,
    period: 'This Month',
    slices: [
      { name: 'School Fees', value: 8250000, pct: 66.3, color: '#22c55e' },
      { name: 'Transport Fees', value: 1450000, pct: 11.6, color: '#3b82f6' },
      { name: 'Exam Fees', value: 1250000, pct: 10.0, color: '#8b5cf6' },
      { name: 'Other Fees', value: 1500000, pct: 12.1, color: '#f59e0b' },
    ],
  },

  collectionTrend: [
    { month: 'Jan', value: 5000000 },
    { month: 'Feb', value: 10200000 },
    { month: 'Mar', value: 9000000 },
    { month: 'Apr', value: 14500000 },
    { month: 'May', value: 18000000 },
  ],

  outstandingOverview: {
    total: 18760000,
    students: 1245,
    slices: [
      { name: 'Current (0-30 days)', value: 6250000, color: '#22c55e' },
      { name: 'Due (31-60 days)', value: 5750000, color: '#f59e0b' },
      { name: 'Overdue (60+ days)', value: 6760000, color: '#ef4444' },
    ],
  },

  recentTransactions: [
    { type: 'Payment', desc: 'School Fees (Term II)', ref: 'RCPT-000589', payer: 'Tabe Clara (S3A)', amount: 150000, when: 'May 22, 2026 10:35 AM' },
    { type: 'Payment', desc: 'Transport Fees', ref: 'RCPT-000588', payer: 'Nghah Emmanuel (S2B)', amount: 100000, when: 'May 22, 2026 10:20 AM' },
    { type: 'Invoice', desc: 'School Fees (Term II)', ref: 'INV-000412', payer: 'Aminata Bello (S4A)', amount: 150000, when: 'May 22, 2026 09:45 AM' },
    { type: 'Payment', desc: 'Exam Fees', ref: 'RCPT-000587', payer: 'Mbong John (S1C)', amount: 50000, when: 'May 22, 2026 09:15 AM' },
    { type: 'Expense', desc: 'Stationery Purchase', ref: 'EXP-000173', payer: 'ABC Supplies', amount: 125000, when: 'May 22, 2026 08:40 AM' },
  ],

  topDefaulters: [
    { name: 'Njie Daniel', class: 'S3A', amount: 245000 },
    { name: 'Bih Mariam', class: 'S2C', amount: 225000 },
    { name: 'Fongod Kevin', class: 'S4B', amount: 215000 },
    { name: 'Ndong Mercy', class: 'S1A', amount: 200000 },
    { name: 'Aminata Bello', class: 'S4A', amount: 195000 },
  ],

  quickSummary: [
    { icon: 'groups', color: '#059669', bg: '#ecfdf5', label: 'Total Students', value: '2,145' },
    { icon: 'receipt_long', color: '#2563eb', bg: '#eff6ff', label: 'Total Invoices', value: '1,875' },
    { icon: 'receipt', color: '#d97706', bg: '#fffbeb', label: 'Total Receipts', value: '1,632' },
    { icon: 'pending_actions', color: '#d97706', bg: '#fffbeb', label: 'Pending Invoices', value: '243' },
    { icon: 'shopping_cart', color: '#dc2626', bg: '#fef2f2', label: 'Expenses This Month', value: xaf(2350000), danger: true },
  ],

  revenueBreakdown: [
    { label: 'School Fees', pct: 66, value: 8250000, color: '#22c55e' },
    { label: 'Transport Fees', pct: 12, value: 1450000, color: '#3b82f6' },
    { label: 'Exam Fees', pct: 10, value: 1250000, color: '#8b5cf6' },
    { label: 'Other Fees', pct: 12, value: 1500000, color: '#f59e0b' },
  ],

  monthlyComparison: [
    { month: 'Jan', thisYear: 12000000, lastYear: 10500000 },
    { month: 'Feb', thisYear: 14200000, lastYear: 12800000 },
    { month: 'Mar', thisYear: 13000000, lastYear: 14000000 },
    { month: 'Apr', thisYear: 16500000, lastYear: 13200000 },
    { month: 'May', thisYear: 18500000, lastYear: 16000000 },
    { month: 'Jun', thisYear: 15000000, lastYear: 13500000 },
  ],

  cashPosition: {
    cashInHand: 2850000,
    updated: '10:35 AM',
    bankBalance: 15250000,
    totalAvailable: 18100000,
  },

  alerts: [
    { icon: 'warning', color: '#dc2626', bg: '#fef2f2', text: '45 students have overdue fees', meta: `Total overdue: ${xaf(6760000)}`, when: '2h ago' },
    { icon: 'trending_up', color: '#d97706', bg: '#fffbeb', text: 'Daily collection is 12.5% higher than yesterday', meta: 'Great job!', when: '3h ago' },
    { icon: 'description', color: '#2563eb', bg: '#eff6ff', text: 'Monthly report for April is ready', meta: 'Click to view report', when: '1d ago' },
  ],
};

const fmtCompact = (n) => `${(n / 1000000).toFixed(0)}M`;

function Sparkline({ data, color }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${color.replace('#', '')})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SkeletonDashboard() {
  return (
    <div className="bd">
      <div className="bd-row-top">
        <div className="skeleton" style={{ height: 190, borderRadius: 16, flex: 2 }} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 190, borderRadius: 16, flex: 1 }} />
        ))}
      </div>
      <div className="bd-row-mid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 340, borderRadius: 14, flex: 1 }} />
        ))}
      </div>
    </div>
  );
}

export default function BursarDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useBursarDashboard();

  if (isLoading) return <SkeletonDashboard />;

  const d = { ...FALLBACK, ...(data || {}) };
  const firstName = (user?.name || 'Mr. David N.').split(' ').slice(-1)[0];

  return (
    <div className="bd">
      {/* ── Row 1: Welcome banner + 4 stat cards ── */}
      <div className="bd-row-top">
        <div className="bd-hero">
          <h1>Good morning, {user?.name?.split(' ')[0] || 'Mr. David'}! 👋</h1>
          <p>Here's what's happening with school finances today.</p>
          <div className="bd-hero-meta">
            <div><span>Date</span><strong>{d.session.date}</strong></div>
            <div><span>Session</span><strong>{d.session.year}</strong></div>
            <div><span>Term</span><strong>{d.session.term}</strong></div>
          </div>
        </div>

        <StatCard
          icon="payments" color="#059669" bg="#ecfdf5" label="Today's Collection"
          value={xaf(d.todayCollection.value)} trend={d.todayCollection.trend} trendLabel="vs yesterday"
          spark={d.todayCollection.spark} sparkColor="#22c55e"
        />
        <StatCard
          icon="account_balance_wallet" color="#2563eb" bg="#eff6ff" label="This Month Collection"
          value={xaf(d.monthCollection.value)} trend={d.monthCollection.trend} trendLabel="vs last month"
          spark={d.monthCollection.spark} sparkColor="#3b82f6"
        />
        <StatCard
          icon="groups" color="#d97706" bg="#fffbeb" label="Outstanding Fees"
          value={xaf(d.outstanding.value)} sub={`${d.outstanding.students.toLocaleString()} Students`}
          spark={d.outstanding.spark} sparkColor="#f59e0b"
        />
        <StatCard
          icon="bar_chart" color="#7c3aed" bg="#faf5ff" label="Total Revenue (YTD)"
          value={xaf(d.revenueYtd.value)} trend={d.revenueYtd.trend} trendLabel="vs last year"
          spark={d.revenueYtd.spark} sparkColor="#8b5cf6"
        />
      </div>

      {/* ── Row 2: Collection Overview / Trend / Outstanding Overview ── */}
      <div className="bd-row-mid">
        <div className="bd-card">
          <div className="bd-card-header">
            <div><h3>Collection Overview</h3><span className="bd-header-sub">This Month</span></div>
          </div>
          <div className="bd-donut-split">
            <div className="bd-donut-wrap">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={d.collectionOverview.slices} dataKey="value" nameKey="name"
                    innerRadius={48} outerRadius={70} paddingAngle={2}
                  >
                    {d.collectionOverview.slices.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="bd-donut-label">
                <span>Total Collected</span>
                <strong>{xaf(d.collectionOverview.total)}</strong>
                <span className="bd-donut-sub">{d.collectionOverview.period}</span>
              </div>
            </div>
            <div className="bd-legend-list">
              {d.collectionOverview.slices.map((s) => (
                <div key={s.name} className="bd-legend-row">
                  <span className="bd-legend-dot" style={{ background: s.color }} />
                  <div>
                    <div className="bd-legend-name">{s.name}</div>
                    <div className="bd-legend-value">{xaf(s.value)}</div>
                  </div>
                  <span className="bd-legend-pct">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/bursar/reports/revenue-summary" className="bd-view-link">View Full Collection Report →</Link>
        </div>

        <div className="bd-card">
          <div className="bd-card-header">
            <h3>Collection Trend</h3>
            <button className="bd-select-pill">This Term <span className="material-symbols-outlined">expand_more</span></button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.collectionTrend} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => xaf(v)} />
              <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 4, fill: '#fff', stroke: '#22c55e', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
          <Link to="/bursar/reports/monthly" className="bd-view-link">View Trend Analysis →</Link>
        </div>

        <div className="bd-card">
          <div className="bd-card-header"><h3>Outstanding Overview</h3></div>
          <div className="bd-donut-split">
            <div className="bd-donut-wrap">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={d.outstandingOverview.slices} dataKey="value" nameKey="name"
                    innerRadius={48} outerRadius={70} paddingAngle={2}
                  >
                    {d.outstandingOverview.slices.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="bd-donut-label">
                <span>Total Outstanding</span>
                <strong>{xaf(d.outstandingOverview.total)}</strong>
                <span className="bd-donut-sub">{d.outstandingOverview.students.toLocaleString()} Students</span>
              </div>
            </div>
            <div className="bd-legend-list">
              {d.outstandingOverview.slices.map((s) => (
                <div key={s.name} className="bd-legend-row">
                  <span className="bd-legend-dot" style={{ background: s.color }} />
                  <div className="bd-legend-name">{s.name}</div>
                  <span className="bd-legend-value bd-legend-value-strong" style={{ color: s.color }}>{xaf(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/bursar/defaulters" className="bd-view-link">View Defaulters →</Link>
        </div>
      </div>

      {/* ── Row 3: Recent Transactions / Top Defaulters / Quick Summary ── */}
      <div className="bd-row-three">
        <div className="bd-card bd-transactions-card">
          <div className="bd-card-header">
            <h3>Recent Transactions</h3>
            <Link to="/bursar/receipts" className="bd-view-all">View All</Link>
          </div>
          <div className="bd-table-wrap">
            <table className="bd-table">
              <thead>
                <tr><th>Type</th><th>Description</th><th>Ref / Invoice</th><th>Payer</th><th>Amount</th><th>Date & Time</th></tr>
              </thead>
              <tbody>
                {d.recentTransactions.map((t, i) => (
                  <tr key={i}>
                    <td><span className={`bd-type-badge type-${t.type.toLowerCase()}`}>{t.type}</span></td>
                    <td>{t.desc}</td>
                    <td className="bd-td-meta">{t.ref}</td>
                    <td>{t.payer}</td>
                    <td className={t.type === 'Expense' ? 'bd-amount-neg' : 'bd-amount-pos'}>{xaf(t.amount)}</td>
                    <td className="bd-td-meta">{t.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bd-card">
          <div className="bd-card-header">
            <h3>Top Defaulters</h3>
            <Link to="/bursar/defaulters" className="bd-view-all">View All</Link>
          </div>
          <div className="bd-defaulters-table">
            <div className="bd-defaulters-head">
              <span>STUDENT</span><span>CLASS</span><span>OUTSTANDING</span>
            </div>
            {d.topDefaulters.map((s, i) => (
              <div key={i} className="bd-defaulter-row">
                <div className="bd-defaulter-name">
                  <span className="bd-defaulter-avatar"><span className="material-symbols-outlined">person</span></span>
                  {s.name}
                </div>
                <span className="bd-defaulter-class">{s.class}</span>
                <span className="bd-defaulter-amount">{xaf(s.amount)}</span>
              </div>
            ))}
          </div>
          <Link to="/bursar/reports/defaulters" className="bd-view-link">View Defaulters Report →</Link>
        </div>

        <div className="bd-card">
          <div className="bd-card-header"><h3>Quick Summary</h3></div>
          <div className="bd-summary-list">
            {d.quickSummary.map((s, i) => (
              <div key={i} className="bd-summary-row">
                <div className="bd-summary-icon" style={{ background: s.bg, color: s.color }}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <span className="bd-summary-label">{s.label}</span>
                <span className={`bd-summary-value ${s.danger ? 'danger' : ''}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Revenue Breakdown / Monthly Comparison / Cash Position / Alerts ── */}
      <div className="bd-row-four">
        <div className="bd-card">
          <div className="bd-card-header">
            <h3>Revenue Breakdown <span className="bd-header-sub">(This Term)</span></h3>
            <Link to="/bursar/reports/revenue-summary" className="bd-view-all">View Report</Link>
          </div>
          {d.revenueBreakdown.map((r) => (
            <div key={r.label} className="bd-breakdown-row">
              <div className="bd-breakdown-top"><span>{r.label}</span><span>{r.pct}%</span></div>
              <div className="bd-breakdown-bar"><div className="bd-breakdown-fill" style={{ width: `${r.pct}%`, background: r.color }} /></div>
              <span className="bd-breakdown-value">{xaf(r.value)}</span>
            </div>
          ))}
        </div>

        <div className="bd-card">
          <div className="bd-card-header">
            <h3>Monthly Collection Comparison</h3>
            <Link to="/bursar/reports/monthly" className="bd-view-all">View Report</Link>
          </div>
          <div className="bd-legend-inline">
            <span><i style={{ background: '#059669' }} />This Year</span>
            <span><i style={{ background: '#d1d5db' }} />Last Year</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.monthlyComparison} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => xaf(v)} />
              <Bar dataKey="lastYear" fill="#d1d5db" radius={[3, 3, 0, 0]} />
              <Bar dataKey="thisYear" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bd-card">
          <div className="bd-card-header">
            <h3>Cash Position</h3>
            <Link to="/bursar/reports/daily-accounts/income" className="bd-view-all">View Details</Link>
          </div>
          <div className="bd-cash-box">
            <span className="bd-cash-label">Cash in Hand</span>
            <strong className="bd-cash-value">{xaf(d.cashPosition.cashInHand)}</strong>
            <span className="bd-cash-updated">Updated: {d.cashPosition.updated}</span>
          </div>
          <div className="bd-cash-row"><span className="material-symbols-outlined">account_balance</span>Bank Balance<strong>{xaf(d.cashPosition.bankBalance)}</strong></div>
          <div className="bd-cash-row"><span className="material-symbols-outlined">payments</span>Total Available<strong>{xaf(d.cashPosition.totalAvailable)}</strong></div>
        </div>

        <div className="bd-card">
          <div className="bd-card-header">
            <h3>Alerts & Notifications</h3>
            <Link to="/bursar/notifications" className="bd-view-all">View All</Link>
          </div>
          <div className="bd-alerts-list">
            {d.alerts.map((a, i) => (
              <div key={i} className="bd-alert-row">
                <div className="bd-alert-icon" style={{ background: a.bg, color: a.color }}>
                  <span className="material-symbols-outlined">{a.icon}</span>
                </div>
                <div className="bd-alert-info">
                  <div className="bd-alert-text">{a.text}</div>
                  <div className="bd-alert-meta">{a.meta}</div>
                </div>
                <span className="bd-alert-when">{a.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, bg, label, value, trend, trendLabel, sub, spark, sparkColor }) {
  return (
    <div className="bd-card bd-stat-card">
      <div className="bd-stat-top">
        <div className="bd-stat-icon" style={{ background: bg, color }}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="bd-card-label">{label}</span>
      </div>
      <strong className="bd-stat-value">{value}</strong>
      {trend != null && (
        <span className="bd-stat-trend">
          <span className="material-symbols-outlined">arrow_upward</span>
          {trend}% {trendLabel}
        </span>
      )}
      {sub && <span className="bd-stat-sub">{sub}</span>}
      <div className="bd-stat-spark"><Sparkline data={spark} color={sparkColor} /></div>
    </div>
  );
}
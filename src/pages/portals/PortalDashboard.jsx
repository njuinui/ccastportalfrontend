// src/pages/portals/ParentDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  useParentDashboard,
  useParentChildren,
} from '../../api/dashboard';
import Avatar from '../../components/Avatar';
import { xaf } from '../../components/ui/formatters';
import './ParentDashboard.css';

/* ── Fallback data ── */
const FALLBACK = {
  attendance: { rate: 96, trend: '↑ 2% vs last term' },
  academic: { average: 16.8, max: 20, trend: '↑ 1.3 vs last term' },
  position: { rank: 5, outOf: 38, trend: '↑ 3 positions' },
  fees: { total: 350000, paid: 315000, balance: 35000, dueDate: 'Aug 15, 2024' },
  messages: { unread: 4 },
  events: { upcoming: 3, next: 'Aug 5' },
  todayAttendance: [
    { subject: 'Mathematics', time: '7:30 AM', status: 'Present', remark: 'On Time' },
    { subject: 'English Language', time: '8:25 AM', status: 'Present', remark: 'On Time' },
    { subject: 'Physics', time: '9:20 AM', status: 'Present', remark: 'On Time' },
    { subject: 'Chemistry', time: '10:15 AM', status: 'Present', remark: 'On Time' },
    { subject: 'Biology', time: '11:10 AM', status: 'Not Marked', remark: '' },
  ],
  academicPerformance: [
    { subject: 'Mathematics', score: '16.8/20', status: 'On Time' },
    { subject: 'English Language', score: '14.2', status: 'On Time' },
    { subject: 'Physics', score: '8', status: 'On Time' },
    { subject: 'Chemistry', score: '4', status: 'On Time' },
    { subject: 'Biology', score: '0', status: 'Not Marked' },
  ],
  subjectPerformance: [
    { subject: 'Mathematics', score: '18/20', color: '#3b82f6' },
    { subject: 'English Language', score: '17/20', color: '#8b5cf6' },
    { subject: 'Physics', score: '16/20', color: '#059669' },
    { subject: 'Chemistry', score: '15/20', color: '#d97706' },
    { subject: 'Biology', score: '15/20', color: '#0ea5e9' },
  ],
  homework: [
    { subject: 'Mathematics', title: 'Algebra Exercises', due: 'Due Tomorrow' },
    { subject: 'English Language', title: 'Essay Writing', due: 'Due in 3 Days' },
    { subject: 'Chemistry', title: 'Practical Report', due: 'Due in 5 Days' },
  ],
  timetable: [
    { period: '1', subject: 'Mathematics', time: '7:30 AM - 8:15 AM', status: 'Completed' },
    { period: '2', subject: 'English Language', time: '8:25 AM - 9:10 AM', status: 'Completed' },
    { period: '3', subject: 'Physics', time: '9:20 AM - 10:05 AM', status: 'Completed' },
    { period: '4', subject: 'Chemistry', time: '10:15 AM - 11:00 AM', status: 'Completed' },
    { period: '5', subject: 'Biology', time: '11:10 AM - 11:55 AM', status: 'Ongoing' },
  ],
  upcomingEvents: [
    { title: 'Parent Teacher Meeting', date: 'Aug 5, 2024', meta: 'Monday, Aug 5, 2024' },
    { title: 'Mid-Term Examinations', date: 'Aug 12, 2024', meta: 'Monday, Aug 12, 2024' },
    { title: 'Sports Day', date: 'Aug 18, 2024', meta: 'Sunday, Aug 18, 2024' },
  ],
  announcements: [
    { title: 'School resumes on Monday, July 1st, 2024' },
    { title: 'New Uniform Policy for 2024/2025 Session' },
    { title: 'PTA Meeting this Saturday' },
  ],
  remarks: [
    { teacher: 'Mr. Williams (Mathematics)', text: 'David is very good in class participation. Keep it up!' },
    { teacher: 'Mrs. Brown (English)', text: 'Good improvement in essay writing. Well done.' },
  ],
};

/* ── Quick Actions ── */
const QUICK_ACTIONS = [
  { icon: 'payments', label: 'Pay Fees', color: '#059669', bg: '#ecfdf5', to: '/parent/fees/pay' },
  { icon: 'event_busy', label: 'Apply for Leave', color: '#d97706', bg: '#fffbeb', to: '/parent/leave-request' },
  { icon: 'download', label: 'Download Report Card', color: '#3b82f6', bg: '#eff6ff', to: '/parent/report-cards/download' },
  { icon: 'schedule', label: 'View Timetable', color: '#8b5cf6', bg: '#faf5ff', to: '/parent/timetable' },
  { icon: 'receipt', label: 'Download Receipt', color: '#db2777', bg: '#fdf2f8', to: '/parent/receipts' },
];

/* ── Skeleton ── */
const ParentDashboardSkeleton = () => (
  <div className="parent-dashboard">
    <div className="pd-header">
      <div className="pd-header-left">
        <div className="skeleton" style={{ width: 260, height: 28 }} />
        <div className="skeleton" style={{ width: 160, height: 14, marginTop: 6 }} />
      </div>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
    </div>
    <div className="pd-stats-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
      ))}
    </div>
    <div className="pd-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 300, borderRadius: 12 }} />
      ))}
    </div>
  </div>
);

/* ════════════════════ MAIN COMPONENT ════════════════════ */
export default function ParentDashboard() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childMenuOpen, setChildMenuOpen] = useState(false);
  const childMenuRef = useRef(null);

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren();
  const children = childrenData?.children || [];

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const { data: dashboardData, isLoading: dashboardLoading } = useParentDashboard(selectedChildId);

  const isLoading = childrenLoading || dashboardLoading;
  const selectedChild = children.find((c) => c.id === selectedChildId) || {
    name: 'David Johnson',
    class: 'Form 5 Science',
  };

  const data = { ...FALLBACK, ...(dashboardData || {}) };

  useEffect(() => {
    const handleClick = (e) => {
      if (childMenuRef.current && !childMenuRef.current.contains(e.target)) {
        setChildMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) return <ParentDashboardSkeleton />;

  return (
    <div className="parent-dashboard">
      {/* ── Header ── */}
      <div className="pd-header">
        <div className="pd-header-left">
          <h1>Welcome back, {user?.name || 'Mr. Johnson'}! 🎉</h1>
          <p>{today}</p>
        </div>
        {children.length > 0 && (
          <div className="pd-child-select" ref={childMenuRef}>
            <div className="pd-child-selector" onClick={() => setChildMenuOpen((o) => !o)}>
              <Avatar name={selectedChild.name} size={40} />
              <div className="pd-child-info">
                <span className="pd-child-name">{selectedChild.name}</span>
                <span className="pd-child-class">{selectedChild.class}</span>
              </div>
              <span className="material-symbols-outlined pd-child-chevron">expand_more</span>
            </div>
            {childMenuOpen && children.length > 1 && (
              <div className="pd-child-menu">
                {children.map((child) => (
                  <button
                    key={child.id}
                    className={selectedChildId === child.id ? 'active' : ''}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      setChildMenuOpen(false);
                    }}
                  >
                    <Avatar name={child.name} size={28} />
                    <span>{child.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div className="pd-stats-grid">
        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <span className="material-symbols-outlined">how_to_reg</span>
          </div>
          <div className="pd-stat-content">
            <span className="pd-stat-value">{data.attendance.rate}%</span>
            <span className="pd-stat-label">Attendance</span>
            <span className="pd-stat-sub">This Term</span>
            <span className="pd-stat-trend">{data.attendance.trend}</span>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="pd-stat-content">
            <span className="pd-stat-value">{data.academic.average}/{data.academic.max}</span>
            <span className="pd-stat-label">Average Score</span>
            <span className="pd-stat-sub">This Term</span>
            <span className="pd-stat-trend">{data.academic.trend}</span>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
            <span className="material-symbols-outlined">emoji_events</span>
          </div>
          <div className="pd-stat-content">
            <span className="pd-stat-value">{data.position.rank}th/{data.position.outOf}</span>
            <span className="pd-stat-label">Class Position</span>
            <span className="pd-stat-sub">This Term</span>
            <span className="pd-stat-trend">{data.position.trend}</span>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="pd-stat-content">
            <span className="pd-stat-value">{xaf(data.fees.balance)}</span>
            <span className="pd-stat-label">Balance</span>
            <span className="pd-stat-sub">Due: {data.fees.dueDate}</span>
            <Link to="/parent/fees" className="pd-stat-link">View Fees →</Link>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
            <span className="material-symbols-outlined">chat_bubble</span>
          </div>
          <div className="pd-stat-content">
            <span className="pd-stat-value">{data.messages.unread}</span>
            <span className="pd-stat-label">New Messages</span>
            <span className="pd-stat-sub">Unread Messages</span>
            <Link to="/parent/messages" className="pd-stat-link">View Messages →</Link>
          </div>
        </div>

        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <span className="material-symbols-outlined">calendar_today</span>
          </div>
          <div className="pd-stat-content">
            <span className="pd-stat-value">{data.events.upcoming}</span>
            <span className="pd-stat-label">Upcoming Events</span>
            <span className="pd-stat-sub">Next Event: {data.events.next}</span>
            <Link to="/parent/school-calendar" className="pd-stat-link">View Calendar →</Link>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="pd-grid">
        {/* Today's Attendance */}
        <div className="pd-card pd-attendance-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">fact_check</span>
              Today's Attendance
            </h3>
            <Link to="/parent/attendance" className="pd-view-all">View Full Attendance →</Link>
          </div>
          <div className="pd-card-body">
            <table className="pd-attendance-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {data.todayAttendance.map((row, i) => (
                  <tr key={i}>
                    <td>{row.subject}</td>
                    <td>{row.time}</td>
                    <td>
                      <span className={`pd-status-badge ${row.status === 'Present' ? 'present' : 'not-marked'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.remark || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Performance */}
        <div className="pd-card pd-performance-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">trending_up</span>
              Academic Performance
            </h3>
            <Link to="/parent/results" className="pd-view-all">View Full Performance →</Link>
          </div>
          <div className="pd-card-body">
            <table className="pd-performance-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {data.academicPerformance.map((row, i) => (
                  <tr key={i}>
                    <td>{row.subject}</td>
                    <td>{row.score}</td>
                    <td>
                      <span className={`pd-status-badge ${row.status === 'On Time' ? 'present' : 'not-marked'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="pd-card pd-subjects-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">menu_book</span>
              Subject Performance
            </h3>
            <Link to="/parent/subjects" className="pd-view-all">View All Subjects →</Link>
          </div>
          <div className="pd-card-body">
            {data.subjectPerformance.map((subject, i) => (
              <div key={i} className="pd-subject-item">
                <span className="pd-subject-name">{subject.subject}</span>
                <div className="pd-subject-bar">
                  <div 
                    className="pd-subject-fill" 
                    style={{ 
                      width: `${(parseInt(subject.score) / 20) * 100}%`, 
                      background: subject.color || '#3b82f6' 
                    }} 
                  />
                </div>
                <span className="pd-subject-score">{subject.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Homework & Assignments */}
        <div className="pd-card pd-homework-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">assignment</span>
              Homework & Assignments
            </h3>
            <Link to="/parent/homework" className="pd-view-all">View All Homework →</Link>
          </div>
          <div className="pd-card-body">
            {data.homework.map((hw, i) => (
              <div key={i} className="pd-homework-item">
                <span className="pd-homework-subject">{hw.subject}</span>
                <span className="pd-homework-title">{hw.title}</span>
                <span className="pd-homework-due">{hw.due}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timetable */}
        <div className="pd-card pd-timetable-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">schedule</span>
              Timetable (Today)
            </h3>
            <Link to="/parent/timetable" className="pd-view-all">View Full Timetable →</Link>
          </div>
          <div className="pd-card-body">
            {data.timetable.map((row, i) => (
              <div key={i} className="pd-timetable-item">
                <span className="pd-tt-period">{row.period}.</span>
                <span className="pd-tt-subject">{row.subject}</span>
                <span className="pd-tt-time">{row.time}</span>
                <span className={`pd-tt-status ${row.status.toLowerCase()}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Summary */}
        <div className="pd-card pd-fee-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">account_balance_wallet</span>
              Fee Summary
            </h3>
            <Link to="/parent/fees" className="pd-view-all">View All Fees →</Link>
          </div>
          <div className="pd-card-body">
            <div className="pd-fee-rows">
              <div className="pd-fee-row">
                <span className="pd-fee-label">Total Fees</span>
                <span className="pd-fee-value">{xaf(data.fees.total)}</span>
              </div>
              <div className="pd-fee-row">
                <span className="pd-fee-label">Paid</span>
                <span className="pd-fee-value" style={{ color: '#059669' }}>{xaf(data.fees.paid)}</span>
              </div>
              <div className="pd-fee-row pd-fee-row-balance">
                <span className="pd-fee-label">Balance</span>
                <span className="pd-fee-value" style={{ color: '#dc2626' }}>{xaf(data.fees.balance)}</span>
              </div>
            </div>
            <div className="pd-fee-actions">
              <button className="pd-fee-btn pd-fee-btn-primary" onClick={() => toast.success('Redirecting to payment...')}>
                Pay Fees →
              </button>
              <button className="pd-fee-btn pd-fee-btn-outline" onClick={() => toast.success('Downloading receipt...')}>
                Download Receipt
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="pd-card pd-events-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">event</span>
              Upcoming Events
            </h3>
            <Link to="/parent/school-calendar" className="pd-view-all">View All Events →</Link>
          </div>
          <div className="pd-card-body">
            {data.upcomingEvents.map((event, i) => (
              <div key={i} className="pd-event-item">
                <div className="pd-event-content">
                  <span className="pd-event-title">{event.title}</span>
                  <span className="pd-event-date">{event.date}</span>
                  <span className="pd-event-meta">{event.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="pd-card pd-announce-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">campaign</span>
              Recent Announcements
            </h3>
            <Link to="/parent/notices" className="pd-view-all">View All Announcements →</Link>
          </div>
          <div className="pd-card-body">
            {data.announcements.map((announcement, i) => (
              <div key={i} className="pd-announce-item">
                <span className="pd-announce-bullet">•</span>
                <span className="pd-announce-title">{announcement.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher's Remarks */}
        <div className="pd-card pd-remarks-card">
          <div className="pd-card-header">
            <h3>
              <span className="material-symbols-outlined">chat</span>
              Teacher's Remarks
            </h3>
            <Link to="/parent/remarks" className="pd-view-all">View All Remarks →</Link>
          </div>
          <div className="pd-card-body">
            {data.remarks.map((remark, i) => (
              <div key={i} className="pd-remark-item">
                <span className="pd-remark-teacher">{remark.teacher}</span>
                <span className="pd-remark-text">"{remark.text}"</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="pd-quick-actions">
        <h3>Quick Actions</h3>
        <div className="pd-quick-actions-grid">
          {QUICK_ACTIONS.map((action, i) => (
            <Link 
              key={i} 
              to={action.to} 
              className="pd-quick-action"
              style={{ '--action-color': action.color, '--action-bg': action.bg }}
            >
              <div className="pd-quick-action-icon" style={{ background: action.bg, color: action.color }}>
                <span className="material-symbols-outlined">{action.icon}</span>
              </div>
              <span className="pd-quick-action-label">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="pd-footer">
        © 2024 CCast Secondary School. All rights reserved.
      </div>
    </div>
  );
}
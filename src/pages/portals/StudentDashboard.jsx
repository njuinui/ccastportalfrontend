// src/pages/portals/StudentDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useStudentDashboard } from '../../api/dashboard';
import Avatar from '../../components/Avatar';
import { xaf } from '../../components/ui/formatters';
import './StudentDashboard.css';

/* ── Decorative-only content. Nothing below represents real data, so it's
   safe to keep static — unlike attendance/marks/fees, a motivational quote
   isn't a claim about the student that could be wrong. ── */
const HERO_QUOTE = {
  text: 'Education is the most powerful weapon which you can use to change the world.',
  author: 'Nelson Mandela',
};
const FOOTER_QUOTE = {
  text: 'Success is the sum of small efforts, repeated day in and day out.',
  author: 'Robert Collier',
};

const SCHEDULE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const NOTICE_STYLES = [
  { icon: 'campaign', color: '#dc2626', bg: '#fef2f2' },
  { icon: 'event_note', color: '#059669', bg: '#ecfdf5' },
  { icon: 'menu_book', color: '#7c3aed', bg: '#faf5ff' },
  { icon: 'info', color: '#2563eb', bg: '#eff6ff' },
];

const QUICK_ACTIONS = [
  { icon: 'schedule', label: 'View Timetable', to: '/student/timetable' },
  { icon: 'bar_chart', label: 'Check Results', to: '/student/results' },
  { icon: 'payments', label: 'Pay Fees', to: '/student/fees' },
  { icon: 'local_library', label: 'Library Portal', to: '/student/library' },
  { icon: 'download', label: 'Download Report Card', to: '/student/report-cards' },
  { icon: 'person', label: 'Contact Teacher', to: '/student/messages' },
];

function SkeletonDashboard() {
  return (
    <Container fluid className="sd">
      <Row className="g-3 mb-3">
        <Col lg={4}><div className="skeleton" style={{ height: 190, borderRadius: 16 }} /></Col>
        {[...Array(2)].map((_, i) => (
          <Col lg={4} md={6} key={i}><div className="skeleton" style={{ height: 190, borderRadius: 16 }} /></Col>
        ))}
      </Row>
      <Row className="g-3">
        {[...Array(3)].map((_, i) => (
          <Col lg={4} key={i}><div className="skeleton" style={{ height: 340, borderRadius: 14 }} /></Col>
        ))}
      </Row>
    </Container>
  );
}

function NotLinked() {
  return (
    <Container fluid className="sd">
      <div className="sd-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#94a3b8' }}>
          person_off
        </span>
        <h3 style={{ marginTop: 12 }}>No student record linked to this account</h3>
        <p style={{ color: '#64748b', maxWidth: 480, margin: '8px auto 0' }}>
          Your login isn't connected to a student profile yet. Contact the school office
          so they can link your account to your enrollment record.
        </p>
      </div>
    </Container>
  );
}

/** Small, honest placeholder for widgets with no backing data source yet —
 * used instead of ever inventing numbers for features that aren't built. */
function ComingSoon({ icon, message }) {
  return (
    <div className="sd-empty">
      <span className="material-symbols-outlined">{icon}</span>
      <p>{message}</p>
    </div>
  );
}

function StatCard({ icon, color, bg, label, value, sub, barPct, barColor, foot }) {
  return (
    <div className="sd-card sd-stat-card h-100">
      <div className="sd-stat-top">
        <div className="sd-stat-icon" style={{ background: bg, color }}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="sd-card-label">{label}</span>
      </div>
      <strong className="sd-stat-value">{value}</strong>
      <span className="sd-stat-sub">{sub}</span>
      {barPct != null && (
        <div className="sd-mini-bar">
          <div className="sd-mini-bar-fill" style={{ width: `${barPct}%`, background: barColor }} />
        </div>
      )}
      {foot && <span className="sd-stat-foot">{foot}</span>}
    </div>
  );
}

function fmtExamDate(iso) {
  if (!iso) return { day: '--', month: '---' };
  const dt = new Date(iso + 'T00:00:00');
  return {
    day: dt.toLocaleDateString('en-US', { day: '2-digit' }),
    month: dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useStudentDashboard();

  if (isLoading) return <SkeletonDashboard />;
  if (isError || !data || data.linked === false) return <NotLinked />;

  const d = data;
  const firstName = d.student?.first_name || (user?.name || '').split(' ')[0] || 'Student';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const attendance = d.attendance || {};
  const average = d.average || {};
  const fees = d.fees || {};
  const todaySchedule = d.today_schedule || [];
  const subjectPerformance = d.subject_performance || [];
  const upcomingExams = d.upcoming_exams || [];
  const recentResults = d.recent_results || [];
  const notices = d.notices || [];

  return (
    <Container fluid className="sd">
      {/* ── Row 1: Hero + stat cards ── */}
      <Row className="g-3 mb-3">
        <Col lg={4} md={12}>
          <div className="sd-card sd-hero h-100">
            <div className="sd-hero-left">
              <Avatar photo={user?.photo} name={d.student?.full_name} size={64} className="sd-hero-avatar" />
              <div>
                <h1>Good morning, {firstName}! 👋</h1>
                <p>Stay focused and keep pushing your limits.</p>
              </div>
            </div>
            <div className="sd-hero-quote">
              <span className="sd-quote-mark">"</span>
              <p>{HERO_QUOTE.text}</p>
              <span className="sd-quote-author">— {HERO_QUOTE.author}</span>
            </div>
            <div className="sd-hero-meta">
              <div><span>Class</span><strong>{d.student?.class || '—'}</strong></div>
              <div><span>Admission No.</span><strong>{d.student?.admission_number || '—'}</strong></div>
            </div>
          </div>
        </Col>

        <Col lg={8} md={12}>
          <Row className="g-3 h-50">
            <Col lg={4} md={6} sm={6}>
              {attendance.total > 0 ? (
                <StatCard
                  icon="how_to_reg"
                  color="#059669"
                  bg="#ecfdf5"
                  label="Attendance"
                  value={`${attendance.percent}%`}
                  sub="Present"
                  barPct={attendance.percent}
                  barColor="#22c55e"
                  foot={`${attendance.present} / ${attendance.total} Days`}
                />
              ) : (
                <div className="sd-card sd-stat-card h-100">
                  <div className="sd-stat-top">
                    <div className="sd-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <span className="material-symbols-outlined">how_to_reg</span>
                    </div>
                    <span className="sd-card-label">Attendance</span>
                  </div>
                  <span className="sd-stat-sub" style={{ marginTop: 8 }}>No attendance recorded yet</span>
                </div>
              )}
            </Col>
            <Col lg={4} md={6} sm={6}>
              <div className="sd-card sd-stat-card h-100">
                <div className="sd-stat-top">
                  <div className="sd-stat-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                    <span className="material-symbols-outlined">assignment</span>
                  </div>
                  <span className="sd-card-label">Assignments</span>
                </div>
                <strong className="sd-stat-value">—</strong>
                <span className="sd-stat-sub">Not tracked yet</span>
              </div>
            </Col>
            <Col lg={4} md={6} sm={6}>
              <div className="sd-card sd-fee-card h-100">
                <div className="sd-fee-top">
                  <div className="sd-stat-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <span className="sd-card-label">Fee Balance</span>
                </div>
                <div>
                  <strong className="sd-fee-value">{xaf(fees.balance || 0)}</strong>
                </div>
                <div>
                  <Link to="/student/fees" className="sd-view-link">View details →</Link>
                </div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* ── Row 2: Schedule / Assignments / Academic Performance ── */}
      <Row className="g-3 mb-3">
        <Col lg={6} md={6}>
          <div className="sd-card sd-schedule-card h-100">
            <div className="sd-card-header">
              <h3><span className="material-symbols-outlined">calendar_month</span>Today's Schedule</h3>
              <span className="sd-header-date">{today}</span>
            </div>
            <div className="sd-list-body">
              {todaySchedule.length === 0 && (
                <ComingSoon icon="event_busy" message="No classes scheduled for today." />
              )}
              {todaySchedule.map((s, i) => (
                <div key={i} className="sd-schedule-row">
                  <span className="sd-dot" style={{ background: SCHEDULE_COLORS[i % SCHEDULE_COLORS.length] }} />
                  <div className="sd-schedule-time">{s.time || '—'}</div>
                  <div className="sd-schedule-info">
                    <div className="sd-schedule-subject">{s.subject}</div>
                    {s.teacher && <div className="sd-schedule-teacher">{s.teacher}</div>}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/student/timetable" className="sd-footer-btn">
              <span className="material-symbols-outlined">calendar_month</span>View Full Timetable
            </Link>
          </div>
        </Col>

        <Col lg={6} md={6}>
          <div className="sd-card sd-assignments-card h-100">
            <div className="sd-card-header">
              <h3><span className="material-symbols-outlined">assignment</span>My Assignments</h3>
            </div>
            <ComingSoon
              icon="assignment_late"
              message="Assignment tracking isn't set up yet. Ask your school admin to enable this module."
            />
          </div>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6} md={6}>
          <div className="sd-card h-100">
            <div className="sd-card-header">
              <h3><span className="material-symbols-outlined">event_note</span>Upcoming Exams</h3>
              <Link to="/student/exams" className="sd-view-all">View All</Link>
            </div>
            <div className="sd-list-body">
              {upcomingExams.length === 0 && (
                <ComingSoon icon="event_available" message="No upcoming exams scheduled." />
              )}
              {upcomingExams.map((e, i) => {
                const { day, month } = fmtExamDate(e.date);
                return (
                  <div key={i} className="sd-exam-row">
                    <div className="sd-exam-date">
                      <strong>{day}</strong>
                      <span>{month}</span>
                    </div>
                    <div className="sd-exam-info">
                      <div className="sd-exam-title">{e.title}</div>
                      {e.duration_minutes && (
                        <div className="sd-exam-meta">{e.duration_minutes} minutes</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        <Col lg={6}>
          <div className="sd-card sd-performance-card h-100">
            <div className="sd-card-header">
              <h3><span className="material-symbols-outlined">insights</span>Academic Performance</h3>
              <Link to="/student/results" className="sd-view-all">View Reports</Link>
            </div>
            {average.percent == null ? (
              <ComingSoon icon="insights" message="No marks recorded yet — performance will appear here once results are entered." />
            ) : (
              <div className="sd-performance-body">
                <div className="sd-donut-wrap">
                  <ResponsiveContainer width={140} height={140}>
                    <RadialBarChart
                      innerRadius="75%"
                      outerRadius="100%"
                      data={[{ value: average.percent }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        fill="#22c55e"
                        cornerRadius={10}
                        background={{ fill: '#f1f5f9' }}
                        max={100}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="sd-donut-label">
                    <strong>{average.percent}%</strong>
                    <span>{average.label}</span>
                  </div>
                  <span className="sd-donut-caption">Overall Average</span>
                </div>
                <div className="sd-subjects">
                  <span className="sd-subjects-title">Subject Performance</span>
                  {subjectPerformance.map((s) => (
                    <div key={s.subject} className="sd-subject-row">
                      <span className="sd-subject-name">{s.subject}</span>
                      <div className="sd-subject-bar">
                        <div
                          className="sd-subject-fill"
                          style={{ width: `${s.percent}%`, background: s.percent >= 50 ? '#22c55e' : '#ef4444' }}
                        />
                      </div>
                      <span className="sd-subject-pct">{s.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Row 3: Results / Notices ── */}
      <Row className="g-3 mb-3">
        <Col lg={6} md={6}>
          <div className="sd-card h-100">
            <div className="sd-card-header">
              <h3><span className="material-symbols-outlined">grade</span>Recent Results</h3>
              <Link to="/student/results" className="sd-view-all">View All</Link>
            </div>
            {recentResults.length === 0 ? (
              <ComingSoon icon="grade" message="No results recorded yet." />
            ) : (
              <div className="sd-table-wrap">
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Test/Exam</th>
                      <th>Marks</th>
                      <th>Coeff.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentResults.map((r, i) => (
                      <tr key={i}>
                        <td className="sd-td-strong">{r.subject}</td>
                        <td>{r.exam}</td>
                        <td>{r.marks} / {r.max_score}</td>
                        <td>
                          <span className="sd-grade-badge">{r.coefficient}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link to="/student/results" className="sd-footer-btn">
              <span className="material-symbols-outlined">bar_chart</span>View All Results
            </Link>
          </div>
        </Col>

        <Col lg={6} md={6}>
          <div className="sd-card h-100">
            <div className="sd-card-header">
              <h3><span className="material-symbols-outlined">campaign</span>School Notices</h3>
            </div>
            <div className="sd-list-body">
              {notices.length === 0 && (
                <ComingSoon icon="campaign" message="No active notices right now." />
              )}
              {notices.map((n, i) => {
                const style = NOTICE_STYLES[i % NOTICE_STYLES.length];
                return (
                  <div key={i} className="sd-notice-row">
                    <div className="sd-notice-icon" style={{ background: style.bg, color: style.color }}>
                      <span className="material-symbols-outlined">{style.icon}</span>
                    </div>
                    <div className="sd-notice-info">
                      <div className="sd-notice-title">
                        {n.title}
                        {n.is_new && <span className="sd-new-badge">New</span>}
                      </div>
                      {n.meta && <div className="sd-notice-meta">{n.meta}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <div className="sd-card h-100">
            <div className="sd-card-header">
              <h3><span className="material-symbols-outlined">bolt</span>Quick Actions</h3>
            </div>
            <div className="sd-quick-actions-grid">
              {QUICK_ACTIONS.map((a, i) => (
                <Link key={i} to={a.to} className="sd-quick-action">
                  <span className="material-symbols-outlined">{a.icon}</span>
                  <span>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Footer quote bar ── */}
      <Row>
        <Col xs={12}>
          <div className="sd-footer-bar">
            <div className="sd-footer-quote">
              <span className="material-symbols-outlined">school</span>
              "{FOOTER_QUOTE.text}" — {FOOTER_QUOTE.author}
            </div>
            <div className="sd-footer-cta">You're preparing for a great future! Keep going! 🚀</div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

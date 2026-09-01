import { Link } from 'react-router-dom';
import './QuickActionsGrid.css';

/**
 * QuickActionsGrid — grid of action buttons with icons.
 *
 * @param {{ icon: string, label: string, color: string, bg: string, to: string }[]} actions
 */
export default function QuickActionsGrid({ actions = [] }) {
  return (
    <div className="qa-grid">
      {actions.map((a) => (
        <Link key={a.icon + a.to} to={a.to} className="qa-btn" tabIndex={0}>
          <div className="qa-btn-ic" style={{ background: a.bg, color: a.color }}>
            <span className="material-symbols-outlined">{a.icon}</span>
          </div>
          <span className="qa-btn-label">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
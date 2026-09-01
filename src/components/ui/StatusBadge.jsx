import './StatusBadge.css';

const STATUS_MAP = {
  present:  { label: 'Present',  cls: 'present' },
  absent:   { label: 'Absent',   cls: 'absent' },
  late:     { label: 'Late',     cls: 'late' },
  unmarked: { label: 'Unmarked', cls: 'unmarked' },
  completed: { label: 'Completed', cls: 'completed' },
  ongoing:   { label: 'Ongoing',   cls: 'ongoing' },
  upcoming:  { label: 'Upcoming',  cls: 'upcoming' },
  'due-soon':  { label: 'Due Soon',  cls: 'due-soon' },
  'due-later': { label: 'Due Later', cls: 'due-later' },
  open:      { label: 'Open',      cls: 'open' },
  resolved:  { label: 'Resolved',  cls: 'resolved' },
  escalated: { label: 'Escalated', cls: 'escalated' },
};

/**
 * StatusBadge — renders a colored status pill.
 *
 * @param {string} status - status key (present, absent, late, etc.)
 * @param {string} label  - override display text
 */
export default function StatusBadge({ status, label }) {
  const mapped = STATUS_MAP[status];
  if (!mapped && !label) return <span className="status-dash">—</span>;

  return (
    <span className={`status-badge ${mapped?.cls || status}`}>
      {label || mapped?.label || status}
    </span>
  );
}
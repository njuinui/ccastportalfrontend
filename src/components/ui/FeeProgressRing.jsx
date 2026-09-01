import { xaf } from './formatters';
import './FeeProgressRing.css';

/**
 * FeeProgressRing — circular progress indicator for fee collection.
 *
 * @param {number} collected - amount collected
 * @param {number} goal      - total fee goal
 */
export default function FeeProgressRing({ collected = 0, goal = 0 }) {
  const pct = goal ? Math.round((collected / goal) * 100) : 0;
  const r = 42;
  const C = 2 * Math.PI * r;

  return (
    <div className="fee-ring">
      <div className="fee-ring-circle">
        <svg width={100} height={100} viewBox="0 0 100 100">
          <circle className="fee-ring-bg" cx="50" cy="50" r={r} />
          <circle
            className="fee-ring-fill"
            cx="50"
            cy="50"
            r={r}
            stroke="var(--primary)"
            strokeDasharray={`${C}`}
            strokeDashoffset={C - (pct / 100) * C}
          />
        </svg>
        <div className="fee-ring-center">
          <span
            className="fee-ring-pct"
            style={{
              color:
                pct >= 70
                  ? 'var(--color-success)'
                  : pct >= 40
                    ? 'var(--color-warning)'
                    : 'var(--color-danger)',
            }}
          >
            {pct}%
          </span>
          <span className="fee-ring-label">Collected</span>
        </div>
      </div>
      <div className="fee-ring-amounts">
        <div className="fee-ring-amt">
          <div className="fee-ring-amt-val" style={{ color: 'var(--color-success)' }}>
            {xaf(collected)}
          </div>
          <div className="fee-ring-amt-label">Collected</div>
        </div>
        <div className="fee-ring-amt">
          <div className="fee-ring-amt-val">{xaf(goal)}</div>
          <div className="fee-ring-amt-label">Goal</div>
        </div>
      </div>
    </div>
  );
}
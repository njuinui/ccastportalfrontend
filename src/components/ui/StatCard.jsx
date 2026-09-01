import { useState, useEffect, useRef } from 'react';
import './StatCard.css';

function useCountUp(end, dur = 700) {
  const [v, setV] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (end == null) return;
    const start = prevRef.current;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const cur = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3)));
      setV(cur);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = end;
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, dur]);

  return v;
}

/**
 * StatCard — Compact stat card with icon, value, hint, and optional trend.
 */
export default function StatCard({ label, value, hint, icon, trend }) {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  const isNumeric = typeof num === 'number' && !isNaN(num);
  const display = isNumeric ? useCountUp(num) : value;

  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">
          {isNumeric ? display.toLocaleString() : display}
          {hint && <span className="stat-card-hint">{hint}</span>}
        </div>
        {trend && (
          <div className={`stat-card-trend ${trend.dir}`}>
            <span className="material-symbols-outlined">
              {trend.dir === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {trend.text}
          </div>
        )}
      </div>
    </div>
  );
}
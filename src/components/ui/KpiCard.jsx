import { useState, useEffect, useRef } from 'react';
import './KpiCard.css';

/**
 * Animated count-up hook
 */
function useCountUp(end, dur = 700) {
  const [v, setV] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (end == null) return;
    const start = prevRef.current;
    const t0 = Date.now();

    const tick = () => {
      const progress = Math.min((Date.now() - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (end - start) * eased);
      setV(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };

    // Cancel any previous animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, dur]);

  return v;
}

/**
 * KpiCard — Large metric card with icon, value, trend, sparkline, or progress bar.
 *
 * Props:
 *   icon          — Material Symbols icon name
 *   label         — metric label (uppercase)
 *   value         — numeric value (animated) or string
 *   color         — accent color for the card
 *   bg            — icon background color
 *   sparkData     — array of numbers for sparkline bars
 *   trend         — trend text (e.g. "+12%")
 *   trendDir      — 'up' | 'down' | 'neutral'
 *   compare       — comparison text (e.g. "vs last month")
 *   progress      — 0-100 for progress bar
 *   progressColor — color for the progress fill
 *   hint          — subtitle text
 *   badge         — { cls, icon?, text } for badge
 */
export default function KpiCard({
  icon,
  label,
  value,
  color,
  bg,
  sparkData,
  trend,
  trendDir,
  compare,
  progress,
  progressColor,
  hint,
  badge,
}) {
  const countUp = useCountUp(typeof value === 'number' ? value : null);
  const display = typeof value === 'number' ? countUp.toLocaleString() : value;

  return (
    <div
      className="ad-kpi"
      style={color ? { '--ad-kpi-color': color } : {}}
      tabIndex={0}
    >
      <div className="ad-kpi-top">
        <div
          className="ad-kpi-ic"
          style={{ background: bg || 'var(--primary)', color: '#fff' }}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {badge && (
          <span className={`ad-badge ${badge.cls}`}>
            {badge.icon && (
              <span className="material-symbols-outlined">{badge.icon}</span>
            )}
            {badge.text}
          </span>
        )}
      </div>

      <div className="ad-kpi-label">{label}</div>
      <div className="ad-kpi-value">{display}</div>

      {trend && (
        <div className="ad-kpi-row">
          <span className={`ad-kpi-trend ${trendDir}`}>
            <span className="material-symbols-outlined">
              {trendDir === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {trend}
          </span>
          {compare && <span className="ad-kpi-compare">{compare}</span>}
        </div>
      )}

      {sparkData && (
        <div className="ad-kpi-spark">
          {sparkData.map((v, i) => (
            <div
              key={i}
              style={{
                height: `${(v / Math.max(...sparkData, 1)) * 100}%`,
                background: color || 'var(--primary)',
                opacity: i >= sparkData.length - 2 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}

      {progress != null && (
        <div className="ad-progress">
          <span
            style={{
              width: `${Math.min(100, progress)}%`,
              background:
                progressColor ||
                `linear-gradient(90deg, var(--primary), var(--color-info))`,
            }}
          />
        </div>
      )}

      {hint && !sparkData && progress == null && (
        <div className="ad-kpi-hint">{hint}</div>
      )}
    </div>
  );
}
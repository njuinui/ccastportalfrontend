/**
 * Sparkline — tiny SVG line chart for inline use.
 *
 * @param {number[]} data  - data points
 * @param {string}   color - stroke color
 * @param {number}   h     - height in px
 * @param {number}   w     - width in px
 */
export default function Sparkline({ data = [], color = '#3b82f6', h = 18, w = 60 }) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`)
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
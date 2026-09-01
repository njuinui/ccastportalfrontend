/**
 * PerformanceChart — inline SVG line/area chart for academic performance.
 *
 * @param {{ label: string, value: number }[]} points
 * @param {number} maxScore - max possible score (default 20)
 */
export default function PerformanceChart({ points = [], maxScore = 20 }) {
  const width = 460;
  const height = 110;
  const stepX = width / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - (p.value / maxScore) * height,
    value: p.value,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x || 0} ${height} L 0 ${height} Z`;

  return (
    <div className="performance-chart-wrap">
      <svg
        className="performance-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="perfAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#perfAreaFill)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="4" fill="#fff" stroke="var(--primary)" strokeWidth="2" />
        ))}
      </svg>
      <div className="performance-chart-labels">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
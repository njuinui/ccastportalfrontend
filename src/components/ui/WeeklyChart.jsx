import './WeeklyChart.css';

/**
 * WeeklyChart — bar chart for weekly collection data.
 *
 * @param {{ day: string, amount: number }[]} data
 */
export default function WeeklyChart({ data = [] }) {
  if (data.length === 0) {
    // Default demo data
    data = [
      { day: 'Mon', amount: 1200000 },
      { day: 'Tue', amount: 1800000 },
      { day: 'Wed', amount: 950000 },
      { day: 'Thu', amount: 2400000 },
      { day: 'Fri', amount: 1600000 },
      { day: 'Sat', amount: 700000 },
    ];
  }

  const max = Math.max(...data.map((d) => d.amount), 1);
  const peakIdx = data.findIndex((d) => d.amount === max);

  return (
    <div className="weekly-chart">
      <div className="weekly-chart-bars">
        {data.map((d, i) => (
          <div key={i} className="weekly-chart-col">
            <div
              className={`weekly-chart-bar ${i === peakIdx ? 'peak' : ''}`}
              style={{ height: `${(d.amount / max) * 100}%` }}
              title={`${d.day}: ${d.amount.toLocaleString()} XAF`}
            />
            <span className="weekly-chart-lbl">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
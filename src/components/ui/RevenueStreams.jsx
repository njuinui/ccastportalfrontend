import MiniDonut from './MiniDonut';
import './RevenueStreams.css';

const STREAM_COLORS = ['#00236f', '#3b82f6', '#93c5fd', '#c7d2fe', '#a5b4fc'];

/**
 * RevenueStreams — donut chart showing revenue breakdown by source.
 *
 * @param {{ name: string, amount: number }[]} data
 * @param {number} total — total revenue
 */
export default function RevenueStreams({ data, total }) {
  if (!data || data.length === 0) {
    // Default demo data
    data = [
      { name: 'Tuition', amount: 12000000 },
      { name: 'Exam Fees', amount: 3200000 },
      { name: 'Hall Tickets', amount: 800000 },
      { name: 'Other', amount: 500000 },
    ];
    total = total || 16500000;
  }

  const donutData = data.map((d, i) => ({
    value: d.amount,
    color: STREAM_COLORS[i % STREAM_COLORS.length],
  }));

  return (
    <div className="rev-streams">
      <div className="rev-streams-title">Revenue Streams</div>
      <div className="rev-streams-wrap">
        <div className="rev-streams-donut">
          <MiniDonut data={donutData} size={100} stroke={14} />
          <div className="rev-streams-center">
            <span className="rev-streams-center-val">
              {(total || 0) >= 1000000
                ? `${(total / 1000000).toFixed(1)}M`
                : total?.toLocaleString()}
            </span>
            <span className="rev-streams-center-lbl">Total</span>
          </div>
        </div>
        <div className="rev-streams-legend">
          {data.map((d, i) => (
            <div key={i} className="rev-streams-leg">
              <div
                className="rev-streams-leg-dot"
                style={{ background: STREAM_COLORS[i % STREAM_COLORS.length] }}
              />
              <span className="rev-streams-leg-name">{d.name}</span>
              <span className="rev-streams-leg-pct">
                {total ? Math.round((d.amount / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
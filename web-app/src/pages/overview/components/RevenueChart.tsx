import type { RevenueChartPoint } from '../../../api/dashboardApi';

interface RevenueChartProps {
  data: RevenueChartPoint[];
}

function formatMillions(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toString();
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const width = 100;
  const height = 48;
  const padding = 4;

  const points = data.map((d, i) => {
    const x =
      padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      (d.revenue / maxRevenue) * (height - padding * 2);
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="card-surface flex flex-col p-5">
      <div className="mb-4">
        <h3 className="m-0 text-base font-bold text-primary-dark">
          Xu hướng 7 ngày
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Tổng thu theo ngày (đặt sân + bán gói)
        </p>
      </div>

      <div className="relative flex-1 min-h-[200px]">
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[10px] text-slate-400">
          <span>{formatMillions(maxRevenue)}</span>
          <span>{formatMillions(maxRevenue / 2)}</span>
          <span>0</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="ml-8 h-[180px] w-[calc(100%-2rem)]"
          preserveAspectRatio="none"
        >
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={padding}
              y1={height - padding - ratio * (height - padding * 2)}
              x2={width - padding}
              y2={height - padding - ratio * (height - padding * 2)}
              stroke="#e5e7eb"
              strokeWidth="0.3"
            />
          ))}
          <polyline
            fill="none"
            stroke="#1f6650"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyline}
          />
          {points.map((p) => (
            <circle
              key={p.date}
              cx={p.x}
              cy={p.y}
              r="1.8"
              fill="#1f6650"
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
        </svg>

        <div className="ml-8 mt-2 flex justify-between text-xs text-slate-500">
          {data.map((d) => (
            <span key={d.date}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

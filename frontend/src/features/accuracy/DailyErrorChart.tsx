import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { DailyErrorItem } from "../../lib/types";

interface DailyErrorChartProps {
  data: DailyErrorItem[];
}

interface DailyTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyErrorItem & { dateLabel: string } }>;
}

const DailyTooltip: React.FC<DailyTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  if (!item) return null;

  return (
    <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1 min-w-[210px]">
      <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
        Delivery Date: {item.date}
      </div>
      <div className="flex justify-between pt-0.5">
        <span className="text-sky-400">Daily MAE:</span>
        <span className="font-mono font-bold text-sky-400">{item.mae.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between">
        <span className="text-rose-400">Daily Bias (Act − Fc):</span>
        <span className="font-mono font-bold text-rose-400">{item.bias.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between text-amber-300 pt-0.5 border-t border-slate-800">
        <span>Daily P95 Shortfall:</span>
        <span className="font-mono font-bold">{item.p95Shortfall.toLocaleString()} MW</span>
      </div>
    </div>
  );
};

export const DailyErrorChart: React.FC<DailyErrorChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: d.date.slice(5), // MM-DD for clean display
  }));

  return (
    <div className="space-y-4 w-full">
      {/* Panel 1: Daily MAE (Magnitude) as Bars */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-700">Daily MAE (Magnitude of Error)</span>
          <span className="text-[11px] text-slate-500">Bars (MW)</span>
        </div>
        <div className="w-full h-[150px] sm:h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="dateLabel" tickLine={false} stroke="#94a3b8" fontSize={10} hide />
              <YAxis
                tickLine={false}
                stroke="#64748b"
                fontSize={10}
                width={35}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                dx={-2}
                domain={[0, "auto"]}
              />
              <Tooltip content={<DailyTooltip />} />
              <Bar dataKey="mae" name="Daily MAE (MW)" fill="#0284c7" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Panel 2: Daily Bias (Directional Over/Under Forecast) without Curve Smoothing */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-700">
            Daily Forecast Bias (Negative = Over-Forecast)
          </span>
          <span className="text-[11px] text-slate-500">Zero-Centered (MW)</span>
        </div>
        <div className="w-full h-[135px] sm:h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
              <XAxis dataKey="dateLabel" tickLine={false} stroke="#64748b" fontSize={10} minTickGap={16} dy={6} />
              <YAxis
                tickLine={false}
                stroke="#64748b"
                fontSize={10}
                width={35}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                dx={-2}
              />
              <Tooltip content={<DailyTooltip />} />
              <Bar dataKey="bias" name="Daily Bias (MW)" fill="#f43f5e" radius={[2, 2, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Caption updated per review guidance */}
      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
        <strong>Daily Error Progression:</strong> Illustrates daily forecast volatility across January 2026.
        Notice large over-forecast episodes (Jan 11-12, Jan 28) where day-ahead over-forecasting spiked sharply.
        Daily P95 shortfall buffer is displayed in the tooltip.
      </div>
    </div>
  );
};

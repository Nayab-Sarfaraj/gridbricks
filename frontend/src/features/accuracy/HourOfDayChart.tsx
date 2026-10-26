import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { HourOfDayBreakdownItem } from "../../lib/types";

interface HourOfDayChartProps {
  data: HourOfDayBreakdownItem[];
}

export const HourOfDayChart: React.FC<HourOfDayChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    ...d,
    hourLabel: `${String(d.hour).padStart(2, "0")}:00`,
  }));

  return (
    <div className="space-y-3 w-full">
      <div className="w-full h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
            <XAxis
              dataKey="hourLabel"
              tickLine={false}
              stroke="#64748b"
              fontSize={10}
              minTickGap={16}
              dy={6}
            />
            <YAxis
              tickLine={false}
              stroke="#64748b"
              fontSize={10}
              width={35}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              dx={-2}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0].payload as HourOfDayBreakdownItem & { hourLabel: string };
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1 min-w-[210px]">
                    <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                      Delivery Hour: {item.hourLabel} UK Time
                    </div>
                    <div className="pt-1 flex justify-between">
                      <span className="text-sky-400">MAE:</span>
                      <span className="font-mono font-bold text-sky-400">
                        {item.mae.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-400">P95 Shortfall Buffer:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {item.p95Shortfall.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="text-rose-400">Bias (Act − Fc):</span>
                      <span className="font-mono font-bold text-rose-400">
                        {item.bias.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.count} half-hours evaluated
                    </div>
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
            <Bar dataKey="mae" name="MAE (MW)" fill="#0284c7" radius={[3, 3, 0, 0]} />
            <Line
              type="monotone"
              dataKey="p95Shortfall"
              name="P95 Shortfall (MW)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="bias"
              name="Bias / Mean Error (MW)"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed space-y-2">
        <div>
          <strong>Delivery Hour Pattern:</strong> Systematic bias is persistent across all 24 hours of the day (ranging from -1.3 GW to -2.3 GW).
        </div>
        <div>
          <span className="text-slate-600 font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
            Error = Actual − Forecast (Negative = forecast too high)
          </span>
        </div>
      </div>
    </div>
  );
};

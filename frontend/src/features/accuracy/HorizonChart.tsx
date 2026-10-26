import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { HorizonBreakdownItem } from "../../lib/types";

interface HorizonChartProps {
  data: HorizonBreakdownItem[];
}

export const HorizonChart: React.FC<HorizonChartProps> = ({ data }) => {
  return (
    <div className="space-y-3 w-full">
      <div className="w-full h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              stroke="#64748b"
              fontSize={11}
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
                const item = payload[0].payload as HorizonBreakdownItem;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1 min-w-[200px]">
                    <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                      Lead Time: {item.bucket} Ahead
                    </div>
                    <div className="pt-1 flex justify-between">
                      <span className="text-slate-400">Evaluated Forecasts:</span>
                      <span className="font-mono font-medium">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sky-400">MAE:</span>
                      <span className="font-mono font-bold text-sky-400">
                        {item.mae.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-400">P95 Shortfall:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {item.p95Shortfall.toLocaleString()} MW
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>Bias (Mean Error):</span>
                      <span className="font-mono">{item.bias.toLocaleString()} MW</span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
            <Bar dataKey="mae" name="MAE (MW)" fill="#0284c7" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="p95Shortfall"
              name="P95 Shortfall Buffer (MW)"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
        <strong>Lead Time Horizon Insight:</strong> Forecast error (MAE) drops monotonically from{" "}
        <strong>2,307 MW</strong> at 48h+ down to <strong>1,654 MW</strong> at 0-6h as weather models converge.
        <span className="block mt-1 text-slate-600 font-medium">
          Note: The 0-6h bucket includes forecasts published after cutoff (shows what a later cutoff would gain).
        </span>
      </div>
    </div>
  );
};

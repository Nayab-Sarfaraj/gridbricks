import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { ForecastPoint } from "../../lib/types";
import { BufferBandToggle, type BandViewMode } from "./BufferBandToggle";
import { ForecastTooltip, type ChartDataPoint } from "./ForecastTooltip";
import { buildForecastChartPoints } from "./forecastUtils";

interface ForecastChartProps {
  points: ForecastPoint[];
  suggestedBufferP95: number;
  debiasedBufferP95: number;
  cutoffTime: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  points,
  suggestedBufferP95,
  debiasedBufferP95,
  cutoffTime,
}) => {
  const [bandView, setBandView] = useState<BandViewMode>("both");

  // Transform 48 points into chart items with clamped lower bounds
  const chartData = useMemo<ChartDataPoint[]>(
    () => buildForecastChartPoints(points, suggestedBufferP95, debiasedBufferP95),
    [points, suggestedBufferP95, debiasedBufferP95]
  );

  return (
    <div className="space-y-4 w-full">
      <BufferBandToggle
        bandView={bandView}
        onBandViewChange={setBandView}
        suggestedBufferP95={suggestedBufferP95}
        debiasedBufferP95={debiasedBufferP95}
        cutoffTime={cutoffTime}
      />

      <div className="w-full h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="timeLabel"
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
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              dx={-2}
            />

            <Tooltip content={<ForecastTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
            />

            {/* Shaded Conservative Buffer Band (Clamped at 0 MW, Stepped) */}
            {(bandView === "conservative" || bandView === "both") && (
              <Area
                type="stepAfter"
                dataKey="conservativeBand"
                name="Conservative Buffer Band (P95 Shortfall)"
                fill="#f59e0b"
                fillOpacity={0.12}
                stroke="#f59e0b"
                strokeWidth={1}
              />
            )}

            {/* Shaded Debiased Buffer Band with distinct crisp outline and light fill */}
            {(bandView === "debiased" || bandView === "both") && (
              <Area
                type="stepAfter"
                dataKey="debiasedBand"
                name="Buffer after bias correction"
                fill="#6366f1"
                fillOpacity={bandView === "both" ? 0.05 : 0.16}
                stroke="#4f46e5"
                strokeWidth={bandView === "both" ? 1.5 : 1}
                strokeDasharray={bandView === "both" ? "4 3" : undefined}
              />
            )}

            {/* Hourly Forecast Line (Stepped) */}
            <Line
              type="stepAfter"
              dataKey="forecast"
              name="Cutoff Forecast (09:00 UK)"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, stroke: "#0284c7", strokeWidth: 2, fill: "#fff" }}
            />

            {/* Actual Outturn Line (Linear settlement interpolation) */}
            <Line
              type="linear"
              dataKey="actual"
              name="Actual Outturn (FUELHH)"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed flex items-start gap-2">
        <span className="font-semibold text-slate-700 shrink-0">Note:</span>
        <span>
          Lower buffer bands are clamped at 0 MW to prevent displaying negative power. The
          conservative band ({Math.round(suggestedBufferP95)} MW) covers full 95% shortfall risk; the
          buffer after bias correction ({Math.round(debiasedBufferP95)} MW) illustrates the buffer required if systemic
          over-prediction (~1.75 GW) is hedged or calibrated.
        </span>
      </div>
    </div>
  );
};

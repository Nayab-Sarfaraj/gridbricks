import React from "react";

export interface ChartDataPoint {
  timeLabel: string;
  utcTime: string;
  forecast: number | null;
  actual: number | null;
  error: number | null;
  conservativeLower: number | null;
  debiasedLower: number | null;
  conservativeBand: [number, number] | null;
  debiasedBand: [number, number] | null;
  publishTime: string | null;
  missingReason: string | null;
}

export interface ForecastTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

export const ForecastTooltip: React.FC<ForecastTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as ChartDataPoint;

  return (
    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[220px]">
      <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex justify-between">
        <span>{p.timeLabel} UK Time</span>
        <span className="font-normal text-slate-400">Slot {p.timeLabel}</span>
      </div>

      <div className="space-y-1 pt-1">
        <div className="flex justify-between items-center">
          <span className="text-sky-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Cutoff Forecast:
          </span>
          <span className="font-mono font-semibold">
            {p.forecast !== null ? `${p.forecast.toLocaleString()} MW` : "Missing"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Actual Outturn:
          </span>
          <span className="font-mono font-semibold">
            {p.actual !== null ? `${p.actual.toLocaleString()} MW` : "Missing"}
          </span>
        </div>

        {p.error !== null && (
          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
            <span className="text-slate-300">Error (Act − Fc):</span>
            <span
              className={`font-mono font-bold ${
                p.error < 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {p.error > 0 ? `+${p.error}` : p.error} MW
            </span>
          </div>
        )}

        {p.forecast !== null && (
          <div className="text-[11px] text-slate-400 pt-1 space-y-0.5 border-t border-slate-800/60">
            <div className="flex justify-between">
              <span>P95 Buffer Floor:</span>
              <span className="font-mono text-amber-300 font-medium">
                {p.conservativeLower?.toLocaleString()} MW
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bias-Corrected Floor:</span>
              <span className="font-mono text-indigo-300 font-medium">
                {p.debiasedLower?.toLocaleString()} MW
              </span>
            </div>
          </div>
        )}

        {p.missingReason && (
          <div className="mt-1.5 p-1 bg-rose-950/50 border border-rose-800 text-rose-300 rounded text-[11px]">
            Dropped: {p.missingReason}
          </div>
        )}
      </div>
    </div>
  );
};

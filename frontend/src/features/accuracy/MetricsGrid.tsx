import React from "react";
import { MetricCard } from "../../components/common/MetricCard";
import { formatMW, formatPercent } from "../../lib/utils";
import type { MetricsResponse } from "../../lib/types";
import {
  BarChart3,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface MetricsGridProps {
  metrics?: MetricsResponse;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="space-y-3 sm:space-y-3.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        <MetricCard
          label="MAE"
          value={formatMW(metrics?.mae)}
          subtext="Mean Absolute Error"
          icon={<BarChart3 className="w-4 h-4 text-slate-400" />}
        />

        <MetricCard
          label="RMSE"
          value={formatMW(metrics?.rmse)}
          subtext="Root Mean Squared Error"
          icon={<BarChart3 className="w-4 h-4 text-slate-400" />}
        />

        <MetricCard
          label="Bias (Mean Error)"
          value={formatMW(metrics?.bias)}
          subtext="Negative = Over-forecast"
          variant="warning"
          icon={<TrendingDown className="w-4 h-4 text-amber-500" />}
        />

        <MetricCard
          label="P95 Shortfall"
          value={formatMW(metrics?.suggestedBufferP95)}
          subtext="Headline safety buffer"
          variant="warning"
          icon={<ShieldAlert className="w-4 h-4 text-amber-600" />}
        />

        <MetricCard
          label="P90 Shortfall"
          value={formatMW(metrics?.suggestedBufferP90)}
          subtext="Secondary safety buffer"
          icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
        />

        <MetricCard
          label="Debiased Buffer P95"
          value={formatMW(metrics?.debiasedBufferP95)}
          subtext="Buffer after bias correction"
          variant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Dataset & Coverage Footnote */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[11px] sm:text-xs text-slate-500 bg-slate-100/80 border border-slate-200/80 px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Sample: <strong>{metrics?.usedSlots ?? "—"}</strong> of{" "}
            <strong>{metrics?.totalSlots ?? "—"}</strong> slots ({metrics?.droppedSlots ?? 0} dropped)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
          <span>MAE % of Mean: <strong>{formatPercent(metrics?.maePercent)}</strong></span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>Delivery: Jan 2 – Feb 1, 2026</span>
        </div>
      </div>
    </div>
  );
};

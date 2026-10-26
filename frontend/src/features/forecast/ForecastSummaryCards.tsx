import React from "react";
import { MetricCard } from "../../components/common/MetricCard";
import { formatMW, formatMWh } from "../../lib/utils";
import type { ForecastResponse } from "../../lib/types";
import { Zap, Activity, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

interface ForecastSummaryCardsProps {
  data?: ForecastResponse;
}

export const ForecastSummaryCards: React.FC<ForecastSummaryCardsProps> = ({ data }) => {
  const missingSlots = data?.missingSlots ?? 0;
  const totalSlots = data?.totalSlots ?? 48;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
      <MetricCard
        label="Forecast Energy"
        value={formatMWh(data?.forecastTotalMwh)}
        subtext="Total MWh generation (sum(MW) × 0.5h)"
        icon={<Zap className="w-4 h-4 text-amber-500" />}
      />

      <MetricCard
        label="Average Power"
        value={formatMW(data?.forecastAvgMw)}
        subtext="Mean day-ahead forecast capacity"
        icon={<Activity className="w-4 h-4 text-sky-500" />}
      />

      <MetricCard
        label="Suggested P95 Buffer"
        value={formatMW(data?.suggestedBufferP95)}
        subtext="Conservative buffer (based on all of January)"
        variant="warning"
        icon={<ShieldCheck className="w-4 h-4 text-amber-600" />}
      />

      <MetricCard
        label="Debiased P95 Buffer"
        value={formatMW(data?.debiasedBufferP95)}
        subtext="Buffer after bias correction (based on all of January)"
        variant="success"
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
      />

      <MetricCard
        label="Missing Slots"
        value={data ? `${missingSlots} / ${totalSlots}` : "—"}
        subtext={
          missingSlots === 0
            ? "Complete 48-slot day-ahead coverage"
            : `${missingSlots} slot(s) dropped`
        }
        variant={missingSlots === 0 ? "success" : "neutral"}
        className="col-span-2 sm:col-span-1"
        icon={
          missingSlots === 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          )
        }
      />
    </div>
  );
};

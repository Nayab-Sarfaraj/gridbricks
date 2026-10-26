import React from "react";
import { useMetrics } from "../../hooks/useMetrics";
import { useErrors } from "../../hooks/useErrors";
import { MetricsGrid } from "./MetricsGrid";
import { HorizonChart } from "./HorizonChart";
import { HourOfDayChart } from "./HourOfDayChart";
import { DailyErrorChart } from "./DailyErrorChart";
import { ChartWrapper } from "../../components/common/ChartWrapper";

export const AccuracyTab: React.FC = () => {
  const { data: metrics } = useMetrics();

  const {
    data: errors,
    isLoading: errorsLoading,
    isError: errorsError,
    error: errorsErr,
    refetch: refetchErrors,
  } = useErrors();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Quantitative Forecast Accuracy & Safety Buffer Sizing
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
          Evaluating national wind forecast accuracy from Elexon BMRS across January 2026 delivery decisions
        </p>
      </div>

      {/* Headline Metric Cards Grid */}
      <MetricsGrid metrics={metrics} />

      {/* Horizon and Hour of Day Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          title="Accuracy by Lead Time (Forecast Horizon)"
          subtitle="How forecast error evolves as lead time decreases from 48h+ down to 0-6h"
          isLoading={errorsLoading}
          isError={errorsError}
          error={errorsErr}
          onRetry={() => refetchErrors()}
        >
          {errors && <HorizonChart data={errors.byHorizon} />}
        </ChartWrapper>

        <ChartWrapper
          title="Accuracy by Delivery Hour of Day"
          subtitle="Intraday error and bias patterns across 24 hours in UK local time"
          isLoading={errorsLoading}
          isError={errorsError}
          error={errorsErr}
          onRetry={() => refetchErrors()}
        >
          {errors && <HourOfDayChart data={errors.byHourOfDay} />}
        </ChartWrapper>
      </div>

      {/* Daily Error Series Chart */}
      <ChartWrapper
        title="Daily Error Series Across January 2026"
        subtitle="Tracking daily MAE and Bias across all 31 delivery days (Jan 2 – Feb 1, 2026)"
        isLoading={errorsLoading}
        isError={errorsError}
        error={errorsErr}
        onRetry={() => refetchErrors()}
      >
        {errors && <DailyErrorChart data={errors.dailySeries} />}
      </ChartWrapper>
    </div>
  );
};

import React, { useState } from "react";
import { useForecast } from "../../hooks/useForecast";
import { DatePicker } from "./DatePicker";
import { ForecastSummaryCards } from "./ForecastSummaryCards";
import { ForecastChart } from "./ForecastChart";
import { ChartWrapper } from "../../components/common/ChartWrapper";

export const ForecastTab: React.FC = () => {
  // Default date: Jan 15, 2026
  const [selectedDate, setSelectedDate] = useState("2026-01-15");
  const { data, isLoading, isError, error, refetch } = useForecast(selectedDate);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Header & Quick Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Day-Ahead Wind Forecast (D-1 Hero View)
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Cutoff forecast at 09:00 UK on D-1 vs actual generation outturn across 48 half-hours
          </p>
        </div>

        <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* KPI Summary Cards */}
      <ForecastSummaryCards data={data} />

      {/* Hero 48 Half-Hour Curve */}
      <ChartWrapper
        title={`Delivery Day Profile: ${selectedDate}`}
        subtitle="Comparing cutoff forecast vs actual generation across 48 half-hours (UK local time)"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
      >
        {data && (
          <ForecastChart
            points={data.points}
            suggestedBufferP95={data.suggestedBufferP95}
            debiasedBufferP95={data.debiasedBufferP95}
            cutoffTime={data.cutoff}
          />
        )}
      </ChartWrapper>
    </div>
  );
};

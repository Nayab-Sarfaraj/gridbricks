import type { ForecastPoint } from "../../lib/types";
import { formatUKTime } from "../../lib/utils";
import type { ChartDataPoint } from "./ForecastTooltip";

/**
 * Transforms raw 48 half-hour forecast points into chart series points with
 * clamped buffer bands (floored at 0 MW so negative generation is never shown).
 */
export function buildForecastChartPoints(
  points: ForecastPoint[],
  suggestedBufferP95: number,
  debiasedBufferP95: number
): ChartDataPoint[] {
  return points.map((pt) => {
    const timeLabel = formatUKTime(pt.startTime);
    const fc = pt.forecast;
    const act = pt.actual;

    let conservativeLower: number | null = null;
    let debiasedLower: number | null = null;
    let conservativeBand: [number, number] | null = null;
    let debiasedBand: [number, number] | null = null;

    if (fc !== null) {
      // Clamped at 0 MW so the buffer band never displays unrealistic negative power
      conservativeLower = Math.max(0, Math.round(fc - suggestedBufferP95));
      debiasedLower = Math.max(0, Math.round(fc - debiasedBufferP95));
      conservativeBand = [conservativeLower, fc];
      debiasedBand = [debiasedLower, fc];
    }

    return {
      timeLabel,
      utcTime: pt.startTime,
      forecast: fc,
      actual: act,
      error: pt.error !== null ? Math.round(pt.error) : null,
      conservativeLower,
      debiasedLower,
      conservativeBand,
      debiasedBand,
      publishTime: pt.publishTime,
      missingReason: pt.missingReason,
    };
  });
}

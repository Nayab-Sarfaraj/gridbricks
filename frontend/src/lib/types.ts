export type MissingReason =
  | "no_forecast_published"
  | "no_forecast_before_cutoff"
  | "missing_actual"
  | null;

export interface ForecastPoint {
  startTime: string; // ISO 8601 UTC
  forecast: number | null; // MW
  actual: number | null; // MW
  error: number | null; // MW (actual - forecast)
  publishTime: string | null;
  missingReason: MissingReason;
}

export interface ForecastResponse {
  deliveryDate: string; // YYYY-MM-DD
  cutoff: string; // ISO 8601 UTC
  points: ForecastPoint[];
  forecastTotalMwh: number;
  forecastAvgMw: number;
  suggestedBufferP95: number;
  debiasedBufferP95: number;
  missingSlots: number;
  totalSlots: number;
  droppedByReason: Record<string, number>;
}

export interface MetricsResponse {
  mae: number;
  rmse: number;
  bias: number;
  suggestedBufferP95: number;
  suggestedBufferP90: number;
  debiasedBufferP95: number;
  maePercent: number;
  totalSlots: number;
  usedSlots: number;
  droppedSlots: number;
  droppedByReason: Record<string, number>;
}

export interface HorizonBreakdownItem {
  bucket: string;
  mae: number;
  bias: number;
  p95Shortfall: number;
  count: number;
}

export interface HourOfDayBreakdownItem {
  hour: number;
  mae: number;
  bias: number;
  p95Shortfall: number;
  count: number;
}

export interface DailyErrorItem {
  date: string;
  mae: number;
  bias: number;
  p95Shortfall: number;
  count: number;
}

export interface ErrorsResponse {
  byHorizon: HorizonBreakdownItem[];
  byHourOfDay: HourOfDayBreakdownItem[];
  dailySeries: DailyErrorItem[];
}

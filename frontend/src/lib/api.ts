import type { ErrorsResponse, ForecastResponse, MetricsResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.detail || `HTTP Error ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

export async function fetchForecast(deliveryDate: string): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE}/forecast?date=${encodeURIComponent(deliveryDate)}`);
  return handleResponse<ForecastResponse>(res);
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  return handleResponse<MetricsResponse>(res);
}

export async function fetchErrors(): Promise<ErrorsResponse> {
  const res = await fetch(`${API_BASE}/errors`);
  return handleResponse<ErrorsResponse>(res);
}

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<{ status: string; timestamp: string }>(res);
}

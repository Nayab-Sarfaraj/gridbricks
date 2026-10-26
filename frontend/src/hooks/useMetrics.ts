import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "../lib/api";
import type { MetricsResponse } from "../lib/types";

export function useMetrics() {
  return useQuery<MetricsResponse, Error>({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    staleTime: 1000 * 60 * 10,
  });
}

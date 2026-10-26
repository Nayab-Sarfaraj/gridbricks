import { useQuery } from "@tanstack/react-query";
import { fetchForecast } from "../lib/api";
import type { ForecastResponse } from "../lib/types";

export function useForecast(deliveryDate: string) {
  return useQuery<ForecastResponse, Error>({
    queryKey: ["forecast", deliveryDate],
    queryFn: () => fetchForecast(deliveryDate),
    enabled: Boolean(deliveryDate),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

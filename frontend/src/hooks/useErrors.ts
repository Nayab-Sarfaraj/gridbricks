import { useQuery } from "@tanstack/react-query";
import { fetchErrors } from "../lib/api";
import type { ErrorsResponse } from "../lib/types";

export function useErrors() {
  return useQuery<ErrorsResponse, Error>({
    queryKey: ["errors"],
    queryFn: fetchErrors,
    staleTime: 1000 * 60 * 10,
  });
}

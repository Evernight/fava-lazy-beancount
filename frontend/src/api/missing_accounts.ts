import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "./api";

export function useMissingAccounts() {
  const params = new URLSearchParams(location.search);
  const q = params.toString();
  const url = q ? `missing_accounts?${q}` : "missing_accounts";
  return useQuery({
    queryKey: ["lazy-beancount", "missing_accounts", url],
    queryFn: () => fetchJSON<string>(url),
  });
}

import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "./api";

export interface MissingAccountsOptions {
  fixedDate: boolean;
  currencies: boolean;
}

export function useMissingAccounts(options: MissingAccountsOptions) {
  const params = new URLSearchParams(location.search);
  params.set("fixed_date", String(options.fixedDate));
  params.set("currencies", String(options.currencies));
  const url = `missing_accounts?${params.toString()}`;
  return useQuery({
    queryKey: ["lazy-beancount", "missing_accounts", options.fixedDate, options.currencies, url],
    queryFn: () => fetchJSON<string>(url),
  });
}

import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "./api";

export interface Account {
  account: string;
  type: string;
  status: "Opened" | "Missing" | "Closed";
  currencies: string[];
}

export function useAccounts() {
  const params = new URLSearchParams(location.search);
  const q = params.toString();
  const url = q ? `accounts?${q}` : "accounts";
  return useQuery({
    queryKey: ["lazy-beancount", "accounts", url],
    queryFn: () => fetchJSON<Account[]>(url),
  });
}

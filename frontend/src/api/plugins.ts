import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "./api";

export interface Plugin {
  name: string;
  type: "plugin" | "fava extension";
  config: string;
}

export function usePlugins() {
  const params = new URLSearchParams(location.search);
  const q = params.toString();
  const url = q ? `plugins?${q}` : "plugins";
  return useQuery({
    queryKey: ["lazy-beancount", "plugins", url],
    queryFn: () => fetchJSON<Plugin[]>(url),
  });
}

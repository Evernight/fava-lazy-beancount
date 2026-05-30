import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJSON } from "./api";

export interface CreateAccountResult {
  account: string;
  filename: string;
  line: string;
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (account: string) =>
      postJSON<CreateAccountResult>("create_account", { account }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lazy-beancount", "accounts"] });
    },
  });
}

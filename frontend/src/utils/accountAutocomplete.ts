const MAX_SUGGESTIONS = 30;

/** Colon-segment account name suggestions based on existing accounts. */
export function getAccountSuggestions(allAccounts: string[], input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) {
    const roots = new Set<string>();
    for (const account of allAccounts) {
      const root = account.split(":")[0];
      if (root) roots.add(root);
    }
    return [...roots].sort().slice(0, MAX_SUGGESTIONS);
  }

  const endsWithColon = trimmed.endsWith(":");
  const parts = trimmed.split(":");
  const completedPrefix = endsWithColon
    ? trimmed
    : parts.length > 1
      ? `${parts.slice(0, -1).join(":")}:`
      : "";
  const partial = endsWithColon ? "" : (parts[parts.length - 1] ?? "");

  const candidates = new Set<string>();
  for (const account of allAccounts) {
    if (
      completedPrefix &&
      !account.startsWith(completedPrefix) &&
      account !== completedPrefix.slice(0, -1)
    ) {
      continue;
    }
    const remainder = completedPrefix ? account.slice(completedPrefix.length) : account;
    const nextChunk = remainder.split(":")[0] ?? "";
    if (!nextChunk) continue;
    if (partial && !nextChunk.startsWith(partial)) continue;

    const suggestion = completedPrefix + nextChunk;
    candidates.add(suggestion);
    if (remainder.includes(":")) {
      candidates.add(`${suggestion}:`);
    }
    if (account.startsWith(trimmed) && account.length > trimmed.length) {
      candidates.add(account);
    }
  }
  if (allAccounts.includes(trimmed)) {
    candidates.add(trimmed);
  }

  return [...candidates].sort().slice(0, MAX_SUGGESTIONS);
}

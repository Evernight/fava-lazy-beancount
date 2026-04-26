import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { Box, CssBaseline, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { CustomThemeProvider } from "./theme";
import { AccountsTab } from "./components/AccountsTab";
import { MissingAccountsTab } from "./components/MissingAccountsTab";
import { PluginsTab } from "./components/PluginsTab";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function App() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)}>
          <Tab label="Accounts" />
          <Tab label="Missing Accounts" />
          <Tab label="Plugins" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {tab === 0 && <AccountsTab />}
        {tab === 1 && <MissingAccountsTab />}
        {tab === 2 && <PluginsTab />}
      </Box>
    </Box>
  );
}

export function renderApp(container: Element) {
  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <CssBaseline />
        <App />
      </CustomThemeProvider>
    </QueryClientProvider>,
  );
}

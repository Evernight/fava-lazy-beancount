import { Alert, Box, Chip, CircularProgress, InputAdornment, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import Fuse, { type IFuseOptions } from "fuse.js";
import { useMemo, useState } from "react";
import { useAccounts, type Account } from "../api/accounts";

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

const TYPE_COLORS: Record<string, ChipColor> = {
  Assets: "info",
  Liabilities: "warning",
  Equity: "secondary",
  Expenses: "error",
  Income: "success",
};

const STATUS_COLORS: Record<string, ChipColor> = {
  Opened: "success",
  Missing: "warning",
  Closed: "default",
};

const columns: GridColDef<Account>[] = [
  {
    field: "account",
    headerName: "Account",
    flex: 3,
    minWidth: 200,
  },
  {
    field: "type",
    headerName: "Type",
    flex: 1,
    minWidth: 120,
    renderCell: (params: GridRenderCellParams<Account, string>) => (
      <Chip
        label={params.value}
        color={TYPE_COLORS[params.value ?? ""] ?? "default"}
        size="small"
      />
    ),
  },
  {
    field: "status",
    headerName: "Status",
    flex: 1,
    minWidth: 120,
    renderCell: (params: GridRenderCellParams<Account, string>) => (
      <Chip
        label={params.value}
        color={STATUS_COLORS[params.value ?? ""] ?? "default"}
        size="small"
        variant={params.value === "Closed" ? "outlined" : "filled"}
      />
    ),
  },
  {
    field: "currencies",
    headerName: "Currencies",
    flex: 2,
    minWidth: 160,
    sortable: false,
    renderCell: (params: GridRenderCellParams<Account, string>) => (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {(params.row.currencies ?? []).map((c) => (
          <Chip key={c} label={c} size="small" variant="outlined" />
        ))}
      </Stack>
    ),
    valueGetter: (value: string[]) => (value ?? []).join(", "),
  },
];

const FUSE_OPTIONS: IFuseOptions<Account> = {
  keys: ["account", "type", "status", "currencies"],
  threshold: 0.35,
  ignoreLocation: true,
};

export function AccountsTab() {
  const { data, isLoading, error } = useAccounts();
  const [query, setQuery] = useState("");

  const fuse = useMemo(() => new Fuse(data ?? [], FUSE_OPTIONS), [data]);

  const rows = useMemo(() => {
    if (!query.trim()) return data ?? [];
    return fuse.search(query).map((r) => r.item);
  }, [fuse, query, data]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{String(error)}</Alert>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", gap: 1 }}>
      <TextField
        size="small"
        placeholder="Search accounts…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: 320 }}
      />
      <Box sx={{ flex: 1 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.account}
          disableRowSelectionOnClick
          density="compact"
          initialState={{
            sorting: {
              sortModel: [{ field: "account", sort: "asc" }],
            },
          }}
        />
      </Box>
    </Box>
  );
}

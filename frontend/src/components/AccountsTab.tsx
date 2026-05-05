import { Alert, Box, Chip, CircularProgress, InputAdornment, Link, Stack, TextField, Tooltip, Typography } from "@mui/material";
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
  Closed: "default",
  "Auto (Ignored)": "info",
  "Auto (Not defined)": "warning",
  Missing: "error",
};

const columns: GridColDef<Account>[] = [
  {
    field: "account",
    headerName: "Account",
    flex: 3,
    minWidth: 200,
    renderCell: (params: GridRenderCellParams<Account, string>) => (
      <Link href={getFavaAccountUrl(params.value ?? "")} underline="hover" color="inherit">
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
          {params.value}
        </Typography>
      </Link>
    ),
  },
  {
    field: "type",
    headerName: "Type",
    flex: 1,
    minWidth: 120,
    type: "singleSelect",
    valueOptions: ["Assets", "Liabilities", "Equity", "Expenses", "Income"],
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
    type: "singleSelect",
    valueOptions: ["Opened", "Closed", "Auto (Ignored)", "Auto (Not defined)", "Missing"],
    renderCell: (params: GridRenderCellParams<Account, string>) => (
      <Chip
        label={params.value}
        color={STATUS_COLORS[params.value ?? ""] ?? "default"}
        size="small"
        variant={params.value === "Closed" || params.value === "Auto (Ignored)" ? "outlined" : "filled"}
      />
    ),
  },
  {
    field: "open_date",
    headerName: "Open Date",
    flex: 1,
    minWidth: 110,
    type: "date",
    valueGetter: (value: string | null) => (value ? new Date(value) : null),
    renderCell: (params: GridRenderCellParams<Account, Date>) => (
      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
        {params.row.open_date ?? "—"}
      </Typography>
    ),
  },
  {
    field: "close_date",
    headerName: "Close Date",
    flex: 1,
    minWidth: 110,
    type: "date",
    valueGetter: (value: string | null) => (value ? new Date(value) : null),
    renderCell: (params: GridRenderCellParams<Account, Date>) => (
      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
        {params.row.close_date ?? "—"}
      </Typography>
    ),
  },
  {
    field: "filename",
    headerName: "Defined",
    flex: 2,
    minWidth: 160,
    renderCell: (params: GridRenderCellParams<Account, string>) => {
      const full = params.value ?? "";
      if (!full) return <Typography variant="body2" color="text.disabled">—</Typography>;
      const base = full.split("/").pop() ?? full;
      const lineno = params.row.lineno;
      const label = lineno != null ? `${base}:${lineno}` : base;
      const tooltip = lineno != null ? `${full}:${lineno}` : full;
      const content = (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
          {label}
        </Typography>
      );
      return (
        <Tooltip title={tooltip} placement="top">
          {lineno != null ? (
            <Link href={getFavaEditorUrl(full, lineno)} underline="hover" color="inherit">
              {content}
            </Link>
          ) : content}
        </Tooltip>
      );
    },
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

function getFavaBase(): string {
  return window.location.pathname.split("/extension/")[0];
}

function getFavaEditorUrl(filename: string, lineno: number): string {
  const params = new URLSearchParams({ file_path: filename, line: String(lineno) });
  return `${getFavaBase()}/editor/?${params}`;
}

function getFavaAccountUrl(account: string): string {
  return `${getFavaBase()}/account/${account}/`;
}

const FUSE_OPTIONS: IFuseOptions<Account> = {
  keys: ["account", "type", "status", "currencies", "filename"],
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
      <Box sx={{ flex: 1, "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" } }}>
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

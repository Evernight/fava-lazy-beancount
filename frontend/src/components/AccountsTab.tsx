import { Alert, Box, Chip, CircularProgress, Stack } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from "@mui/x-data-grid";
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
    renderCell: (params: GridRenderCellParams<Account, string[]>) => (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {(params.value ?? []).map((c) => (
          <Chip key={c} label={c} size="small" variant="outlined" />
        ))}
      </Stack>
    ),
    valueGetter: (value: string[]) => (value ?? []).join(", "),
  },
];

export function AccountsTab() {
  const { data, isLoading, error } = useAccounts();

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
    <Box sx={{ height: "calc(100vh - 160px)", width: "100%" }}>
      <DataGrid
        rows={data ?? []}
        columns={columns}
        getRowId={(row) => row.account}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        disableRowSelectionOnClick
        density="compact"
        initialState={{
          sorting: {
            sortModel: [{ field: "account", sort: "asc" }],
          },
        }}
      />
    </Box>
  );
}

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { usePlugins, type Plugin } from "../api/plugins";

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

const TYPE_COLORS: Record<Plugin["type"], ChipColor> = {
  plugin: "info",
  "fava extension": "secondary",
};

function ConfigCell({ config }: { config: string }) {
  if (!config) {
    return <Typography variant="body2" color="text.secondary">—</Typography>;
  }

  const truncated = config.length > 80 ? config.slice(0, 77) + "…" : config;

  return (
    <Tooltip title={<pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{config}</pre>} placement="left">
      <Typography variant="body2" component="code" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
        {truncated}
      </Typography>
    </Tooltip>
  );
}

export function PluginsTab() {
  const { data, isLoading, error } = usePlugins();

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
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Plugin Name</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Configuration</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).map((plugin, index) => (
            <TableRow key={`${plugin.type}-${plugin.name}-${index}`} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  {plugin.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={plugin.type}
                  color={TYPE_COLORS[plugin.type] ?? "default"}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <ConfigCell config={plugin.config} />
              </TableCell>
            </TableRow>
          ))}
          {(data ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No plugins or extensions found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

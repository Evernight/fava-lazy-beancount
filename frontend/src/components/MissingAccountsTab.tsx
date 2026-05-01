import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormGroup,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { useMissingAccounts } from "../api/missing_accounts";

interface CodeMirrorViewerProps {
  content: string;
}

function CodeMirrorViewer({ content }: CodeMirrorViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: contentRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        EditorState.readOnly.of(true),
        EditorView.theme({
          "&": {
            fontFamily: "monospace",
            fontSize: "13px",
          },
          ".cm-content": {
            padding: "8px 0",
          },
          ".cm-line": {
            padding: "0 8px",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: content },
      });
    }
  }, [content]);

  return (
    <Box
      ref={containerRef}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "auto",
        "& .cm-editor": { height: "100%" },
        "& .cm-scroller": { overflow: "auto" },
      }}
    />
  );
}

export function MissingAccountsTab() {
  const [fixedDate, setFixedDate] = useState(true);
  const [currencies, setCurrencies] = useState(true);
  const [includeIgnored, setIncludeIgnored] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useMissingAccounts({ fixedDate, currencies, includeIgnored });

  const handleCopy = async () => {
    if (data) {
      await navigator.clipboard.writeText(data);
      setCopied(true);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
      <Paper variant="outlined" sx={{ p: 2, flexShrink: 0, minWidth: 220 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Options
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox checked={fixedDate} onChange={(e) => setFixedDate(e.target.checked)} size="small" />
            }
            label={
              <Box>
                <Typography variant="body2">Fixed open date</Typography>
                <Typography variant="caption" color="text.secondary">
                  {fixedDate ? "1970-01-01" : "first encounter"}
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox checked={currencies} onChange={(e) => setCurrencies(e.target.checked)} size="small" />
            }
            label={<Typography variant="body2">Specify currencies</Typography>}
          />
          <Divider sx={{ my: 1 }} />
          <FormControlLabel
            control={
              <Checkbox checked={includeIgnored} onChange={(e) => setIncludeIgnored(e.target.checked)} size="small" />
            }
            label={<Typography variant="body2">Include Auto (Ignored)</Typography>}
          />
        </FormGroup>
        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            disabled={!data || data.trim() === ""}
            fullWidth
          >
            Copy
          </Button>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Accounts auto-inserted by <code>auto_accounts</code> or missing from the ledger. Copy and add them to your beancount file.
        </Typography>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{String(error)}</Alert>}

        {!isLoading && !error && (!data || data.trim() === "") && (
          <Alert severity="success">
            No missing accounts — all accounts are explicitly opened in the ledger.
          </Alert>
        )}

        {!isLoading && !error && data && data.trim() !== "" && (
          <CodeMirrorViewer content={data} />
        )}
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Copied to clipboard"
      />
    </Box>
  );
}

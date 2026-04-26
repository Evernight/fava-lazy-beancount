import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
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
  const { data, isLoading, error } = useMissingAccounts();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (data) {
      await navigator.clipboard.writeText(data);
      setCopied(true);
    }
  };

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

  if (!data || data.trim() === "") {
    return (
      <Alert severity="success">
        No missing accounts — all accounts are explicitly opened in the ledger.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          The following accounts are auto-inserted by <code>auto_accounts</code> or missing from the ledger. Copy and add them to your beancount file.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
          sx={{ flexShrink: 0 }}
        >
          Copy
        </Button>
      </Box>
      <CodeMirrorViewer content={data} />
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Copied to clipboard"
      />
    </Box>
  );
}

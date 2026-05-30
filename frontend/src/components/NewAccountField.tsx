import AddIcon from "@mui/icons-material/Add";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useMemo, useState } from "react";
import { useCreateAccount } from "../api/create_account";
import { getAccountSuggestions } from "../utils/accountAutocomplete";

export type NewAccountFieldProps = Readonly<{
  accountNames: string[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}>;

export function NewAccountField({ accountNames, onSuccess, onError }: NewAccountFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [listboxOpen, setListboxOpen] = useState(false);
  const createAccount = useCreateAccount();

  const options = useMemo(() => accountNames, [accountNames]);

  const submit = () => {
    const account = inputValue.trim();
    if (!account || createAccount.isPending) return;
    createAccount.mutate(account, {
      onSuccess: (data) => {
        setInputValue("");
        onSuccess?.(`Added ${data.line}`);
      },
      onError: (err) => {
        onError?.(err instanceof Error ? err.message : String(err));
      },
    });
  };

  return (
    <>
      <Autocomplete
        freeSolo
        disableClearable={false}
        options={options}
        inputValue={inputValue}
        onOpen={() => setListboxOpen(true)}
        onClose={() => setListboxOpen(false)}
        onInputChange={(_event, value) => setInputValue(value)}
        filterOptions={(_opts, state) => getAccountSuggestions(accountNames, state.inputValue)}
        onChange={(_event, value) => {
          if (typeof value === "string") {
            setInputValue(value);
          }
        }}
        sx={{ flex: 1, minWidth: 240 }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="New account (e.g. Assets:Bank:Savings)"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !listboxOpen) {
                event.preventDefault();
                submit();
              }
            }}
            sx={{
              "& .MuiInputBase-input": {
                fontFamily: "monospace",
                fontSize: "0.8rem",
              },
            }}
          />
        )}
      />
      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon />}
        disabled={!inputValue.trim() || createAccount.isPending}
        onClick={submit}
        sx={{ flexShrink: 0, mt: 0.25 }}
      >
        Add
      </Button>
    </>
  );
}

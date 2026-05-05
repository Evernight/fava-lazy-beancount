"""Fava extension for lazy-beancount plugin management and account visibility."""

from __future__ import annotations

import functools
import re
import traceback
from typing import Any

from beancount.core import data
from fava.ext import FavaExtensionBase
from fava.ext import extension_endpoint
from fava.helpers import FavaAPIError
from flask import request

_ACCOUNT_NOT_OPEN_RE = re.compile(r"Account '([^']+)' is not open")


def _extract_error_missing_accounts(errors: list) -> set[str]:
    """Find accounts mentioned in beancount 'not open' validation errors."""
    missing: set[str] = set()
    for error in errors:
        msg = getattr(error, "message", "") or ""
        m = _ACCOUNT_NOT_OPEN_RE.search(msg)
        if m:
            missing.add(m.group(1))
    return missing


def api_response(func):
    """Return {success: true, data: ...} or {success: false, error: ...}."""

    @functools.wraps(func)
    def decorator(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            return {"success": True, "data": result}
        except FavaAPIError as e:
            return {"success": False, "error": e.message}, 500
        except Exception as e:  # pylint: disable=broad-exception-caught
            traceback.print_exception(e)
            return {"success": False, "error": str(e)}, 500

    return decorator


class FavaLazyBeancount(FavaExtensionBase):
    report_title = "Lazy Beancount"
    has_js_module = True

    @extension_endpoint("accounts")
    @api_response
    def api_accounts(self) -> list[dict[str, Any]]:
        """Return all accounts with type, status, and currencies."""
        entries = self.ledger.all_entries

        closed_accounts: dict[str, data.Close] = {}
        opened_accounts: dict[str, data.Open] = {}

        for entry in entries:
            if isinstance(entry, data.Open):
                opened_accounts[entry.account] = entry
            elif isinstance(entry, data.Close):
                closed_accounts[entry.account] = entry

        error_missing = _extract_error_missing_accounts(self.ledger.errors)

        accounts = []
        for account, open_entry in opened_accounts.items():
            is_auto = bool(open_entry.meta.get("auto_accounts"))
            close_entry = closed_accounts.get(account)
            if is_auto:
                if open_entry.meta.get("auto_accounts_ignored"):
                    status = "Auto (Ignored)"
                else:
                    status = "Auto (Not defined)"
            elif close_entry is not None:
                status = "Closed"
            else:
                status = "Opened"

            account_type = account.split(":")[0]
            currencies = list(open_entry.currencies) if open_entry.currencies else []
            filename = open_entry.meta.get("filename", "") if not is_auto else ""
            lineno = open_entry.meta.get("lineno", None) if not is_auto else None

            accounts.append({
                "account": account,
                "type": account_type,
                "status": status,
                "currencies": currencies,
                "filename": filename,
                "lineno": lineno,
                "open_date": str(open_entry.date) if not is_auto else None,
                "close_date": str(close_entry.date) if close_entry is not None else None,
            })

        # Accounts that appear in errors but have no Open directive at all
        for account in sorted(error_missing - opened_accounts.keys()):
            accounts.append({
                "account": account,
                "type": account.split(":")[0],
                "status": "Missing",
                "currencies": [],
                "filename": "",
                "lineno": None,
                "open_date": None,
                "close_date": None,
            })

        accounts.sort(key=lambda a: a["account"])
        return accounts

    @extension_endpoint("missing_accounts")
    @api_response
    def api_missing_accounts(self) -> str:
        """Return beancount Open directives for auto-inserted (missing) accounts."""
        fixed_date = request.args.get("fixed_date", "true").lower() != "false"
        show_currencies = request.args.get("currencies", "true").lower() != "false"
        include_ignored = request.args.get("include_ignored", "false").lower() != "false"

        entries = self.ledger.all_entries
        lines = []

        for entry in entries:
            if not isinstance(entry, data.Open):
                continue
            if not entry.meta.get("auto_accounts"):
                continue
            if entry.meta.get("auto_accounts_ignored") and not include_ignored:
                continue

            date_str = "1970-01-01" if fixed_date else entry.date.strftime("%Y-%m-%d")
            currencies_str = ""
            if show_currencies and entry.currencies:
                currencies_str = " " + ",".join(sorted(entry.currencies))

            lines.append(f"{date_str} open {entry.account}{currencies_str}")

        lines.sort()
        return "\n".join(lines)

    @extension_endpoint("plugins")
    @api_response
    def api_plugins(self) -> list[dict[str, Any]]:
        """Return all enabled beancount plugins and fava extensions."""
        plugins = []

        # Beancount plugins from options_map
        raw_plugins = self.ledger.options.get("plugin", [])
        for item in raw_plugins:
            if isinstance(item, (list, tuple)) and len(item) == 2:
                name, config = item
            else:
                name, config = str(item), ""
            plugins.append({
                "name": name,
                "type": "plugin",
                "config": config or "",
            })

        # Fava extensions from custom directives
        for entry in self.ledger.all_entries:
            if not isinstance(entry, data.Custom):
                continue
            if entry.type != "fava-extension":
                continue
            if not entry.values:
                continue
            name = entry.values[0].value
            config = entry.values[1].value if len(entry.values) > 1 else ""
            plugins.append({
                "name": name,
                "type": "fava extension",
                "config": config or "",
            })

        return plugins

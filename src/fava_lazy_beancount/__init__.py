"""Fava extension for lazy-beancount plugin management and account visibility."""

from __future__ import annotations

import functools
import traceback
from typing import Any

from beancount.core import data
from fava.ext import FavaExtensionBase
from fava.ext import extension_endpoint
from fava.helpers import FavaAPIError


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

        closed_accounts: set[str] = set()
        opened_accounts: dict[str, data.Open] = {}

        for entry in entries:
            if isinstance(entry, data.Open):
                opened_accounts[entry.account] = entry
            elif isinstance(entry, data.Close):
                closed_accounts.add(entry.account)

        accounts = []
        for account, open_entry in opened_accounts.items():
            is_auto = bool(open_entry.meta.get("auto_accounts"))
            if is_auto:
                status = "Missing"
            elif account in closed_accounts:
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
            })

        accounts.sort(key=lambda a: a["account"])
        return accounts

    @extension_endpoint("missing_accounts")
    @api_response
    def api_missing_accounts(self) -> str:
        """Return beancount Open directives for auto-inserted (missing) accounts."""
        entries = self.ledger.all_entries
        lines = []

        for entry in entries:
            if not isinstance(entry, data.Open):
                continue
            if not entry.meta.get("auto_accounts"):
                continue

            date_str = entry.date.strftime("%Y-%m-%d")
            currencies_str = ""
            if entry.currencies:
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

import { renderApp } from "./app";

export default {
  onExtensionPageLoad() {
    const container = document.getElementById("favaLazyBeancountApp");
    if (!container) return;
    renderApp(container);
  },
};

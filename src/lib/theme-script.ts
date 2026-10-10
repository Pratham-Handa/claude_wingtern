/**
 * Runs in <head> before first paint so the page never flashes the wrong
 * theme. Keep in sync with resolveTheme() in lib/client/theme.ts.
 */
export const THEME_STORAGE_KEY = "lens.theme";

export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

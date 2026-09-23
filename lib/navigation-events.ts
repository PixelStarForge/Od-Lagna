"use client";

// Install history patch once to intercept pushState/replaceState in client
if (typeof window !== "undefined") {
  const win = window as unknown as { __odLagnaNavPatched?: boolean };
  if (!win.__odLagnaNavPatched) {
    win.__odLagnaNavPatched = true;
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = origPush.apply(this, args);
      const url = args[2] ? String(args[2]) : undefined;
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("od-lagna-urlchange", { detail: url }));
      }, 0);
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = origReplace.apply(this, args);
      const url = args[2] ? String(args[2]) : undefined;
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("od-lagna-urlchange", { detail: url }));
      }, 0);
      return result;
    };
  }
}

/**
 * Dispatches an application-level URL change notification
 * ensuring components on static routes update their filters immediately.
 */
export function dispatchUrlChange(url?: string): void {
  if (typeof window !== "undefined") {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("od-lagna-urlchange", { detail: url }));
    }, 0);
  }
}

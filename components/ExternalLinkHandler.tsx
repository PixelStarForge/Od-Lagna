"use client";

import { useEffect } from "react";
import { isApp } from "../lib/is-app";

/**
 * Intercepts external links and window.open calls when running inside the Tauri native app,
 * opening them in the user's default system browser (Firefox, Chrome, etc.) via @tauri-apps/plugin-opener.
 */
export function ExternalLinkHandler() {
  useEffect(() => {
    if (!isApp()) return;

    // Patch window.open to use the native system browser for web URLs
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      if (url) {
        const urlString = typeof url === "string" ? url : url.toString();
        if (urlString.startsWith("http://") || urlString.startsWith("https://") || urlString.startsWith("mailto:")) {
          import("@tauri-apps/plugin-opener").then(({ openUrl }) => {
            openUrl(urlString).catch((err) => {
              console.error("Failed to open URL in system browser:", err);
            });
          });
          return null;
        }
      }
      return originalOpen ? originalOpen.call(window, url, target, features) : null;
    };

    // Global click listener to intercept <a href="..."> clicks
    const handleClick = (event: MouseEvent) => {
      // Ignore right clicks or clicks with modifier keys intended for special handling
      if (event.button !== 0 || event.defaultPrevented) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) return;

      try {
        const parsed = new URL(rawHref, window.location.href);

        // Check if the destination is external (different origin, external protocol, or target="_blank")
        const isExternalProtocol = parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
        const isDifferentOrigin = parsed.origin !== window.location.origin;
        const isTargetBlank = anchor.getAttribute("target") === "_blank";

        if (isExternalProtocol && (isDifferentOrigin || isTargetBlank)) {
          event.preventDefault();
          event.stopPropagation();

          import("@tauri-apps/plugin-opener").then(({ openUrl }) => {
            openUrl(parsed.href).catch((err) => {
              console.error("Failed to open URL in system browser:", err);
            });
          });
        }
      } catch {
        // Fallback for simple absolute external URLs if parsing relative fails
        if (rawHref.startsWith("http://") || rawHref.startsWith("https://") || rawHref.startsWith("mailto:")) {
          event.preventDefault();
          event.stopPropagation();

          import("@tauri-apps/plugin-opener").then(({ openUrl }) => {
            openUrl(rawHref).catch((err) => {
              console.error("Failed to open URL in system browser:", err);
            });
          });
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });

    // Prevent default trackpad gesture zoom from scaling the native webview window
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener("gesturestart", handleGesture, { passive: false });
    window.addEventListener("gesturechange", handleGesture, { passive: false });

    // Prevent default Ctrl + Wheel from zooming the entire app window
    const handleWindowWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", handleWindowWheel, { passive: false });

    return () => {
      window.open = originalOpen;
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("gesturestart", handleGesture);
      window.removeEventListener("gesturechange", handleGesture);
      window.removeEventListener("wheel", handleWindowWheel);
    };
  }, []);

  return null;
}


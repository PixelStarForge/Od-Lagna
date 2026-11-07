import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

function getServerSnapshot() {
  return false;
}

/**
 * React hook that returns true when running inside the Tauri native desktop or mobile app.
 * Safe for SSR and hydration.
 */
export function useIsApp(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Returns true when running inside the Tauri native desktop or mobile application.
 */
export function isApp(): boolean {
  return getSnapshot();
}

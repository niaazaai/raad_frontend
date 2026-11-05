import { useCallback } from "react";

/** Screen-reader announcement. No live region is mounted yet, so this stays silent. */
export function useAnnounce(): (message: string) => void {
  return useCallback((message: string) => {
    const node = document.getElementById("raad-announcer");
    if (node) node.textContent = message;
  }, []);
}

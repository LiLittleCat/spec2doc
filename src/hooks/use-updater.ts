import { relaunch } from "@tauri-apps/plugin-process";
import { type Update, check } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useState } from "react";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

interface UpdaterState {
  status: UpdateStatus;
  version: string;
  body: string;
  date: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  error: string;
}

const isTauri =
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

const initialState: UpdaterState = {
  status: "idle",
  version: "",
  body: "",
  date: "",
  progress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  error: "",
};

export function useUpdater() {
  const [state, setState] = useState<UpdaterState>(initialState);
  const [update, setUpdate] = useState<Update | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (!isTauri) return;

    setState((s) => ({ ...s, status: "checking", error: "" }));

    try {
      const result = await check();
      if (result) {
        setState((s) => ({
          ...s,
          status: "available",
          version: result.version,
          body: result.body ?? "",
          date: result.date ?? "",
        }));
        setUpdate(result);
      } else {
        setState((s) => ({ ...s, status: "idle" }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Treat "no release found" as "no update" rather than a hard error
      if (msg.includes("Could not fetch") || msg.includes("Network")) {
        setState((s) => ({ ...s, status: "idle" }));
      } else {
        setState((s) => ({ ...s, status: "error", error: msg }));
      }
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!update) return;

    setState((s) => ({
      ...s,
      status: "downloading",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    }));

    try {
      let totalSize = 0;
      let downloaded = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          totalSize = event.data.contentLength ?? 0;
          setState((s) => ({ ...s, totalBytes: totalSize }));
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          const pct = totalSize > 0 ? Math.round((downloaded / totalSize) * 100) : 0;
          setState((s) => ({
            ...s,
            downloadedBytes: downloaded,
            progress: pct,
          }));
        } else if (event.event === "Finished") {
          setState((s) => ({ ...s, status: "ready", progress: 100 }));
        }
      });

      await relaunch();
    } catch (e) {
      setState((s) => ({
        ...s,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      }));
    }
  }, [update]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return {
    ...state,
    hasUpdate: state.status === "available",
    checkForUpdate,
    downloadAndInstall,
  };
}

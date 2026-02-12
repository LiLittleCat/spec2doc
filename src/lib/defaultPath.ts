import { documentDir, homeDir } from "@tauri-apps/api/path";

const trimTrailingSeparators = (path: string) => path.replace(/[\\/]+$/, "");

const appendDocumentsDir = (path: string) => {
  const base = trimTrailingSeparators(path);
  const separator = base.includes("\\") ? "\\" : "/";
  return `${base}${separator}Documents`;
};

export async function getDefaultDocumentsPath(): Promise<string> {
  const isTauri =
    typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

  if (!isTauri) {
    return "";
  }

  try {
    const path = await documentDir();
    if (path) {
      return trimTrailingSeparators(path);
    }
  } catch {
    // noop: fallback below
  }

  try {
    const path = await homeDir();
    if (path) {
      return appendDocumentsDir(path);
    }
  } catch {
    // noop: fallback below
  }

  return "";
}

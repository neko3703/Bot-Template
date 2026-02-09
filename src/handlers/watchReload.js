import chokidar from "chokidar";
import path from "path";
import { autoReload } from "./autoReload.js";

let reloadTimer = null;
let isReloading = false;

export function watchAndReload(client, commands) {
  const watchPaths = [
    "src/commands",
    "src/events",
    "src/interactions",
    "src/utils",
    "src/constants",
  ];

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  watcher.on("all", async (event, filePath) => {
    // Ignore temporary files
    if (!filePath.endsWith(".js")) return;

    // Debounce
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(async () => {
      if (isReloading) return;
      isReloading = true;

      try {
        console.log("🔄 File changed:", path.basename(filePath));
        await autoReload(client, commands);
        console.log("✅ Hot reload complete");
      } catch (err) {
        console.error("🔥 Hot reload failed:", err);
      } finally {
        isReloading = false;
      }
    }, 500);
  });

  console.log("👀 Hot reload watcher started");
}

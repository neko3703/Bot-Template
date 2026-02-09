import chokidar from "chokidar";
import path from "path";
import { fileURLToPath } from "url";
import { autoReload } from "./autoReload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function watchAndReload(client, commands) {
  const watchPaths = [
    path.resolve(__dirname, "../commands"),
    path.resolve(__dirname, "../events"),
    path.resolve(__dirname, "../interactions"),
    path.resolve(__dirname, "../utils"),
    path.resolve(__dirname, "../constants"),
  ];

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  watcher.on("all", async (event, file) => {
    if (!file.endsWith(".js")) return;

    console.log("🔄 File changed:", path.basename(file));
    await autoReload(client, commands);
    console.log("✅ Hot reload complete");
  });

  console.log("👀 Hot reload watcher started");
}

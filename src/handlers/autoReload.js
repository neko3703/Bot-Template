import {
  reloadCommands,
  reloadEvents,
  reloadInteractions,
  reloadState,
  reloadUtils,
  reloadConstants,
} from "./reloader.js";

let isReloading = false;

export async function autoReload(client, commands) {
  if (isReloading) return;
  isReloading = true;

  try {
    await reloadUtils();
    await reloadConstants();
    await reloadState();
    await reloadCommands(commands);
    await reloadInteractions(client, commands);
    await reloadEvents(client);
  } catch (err) {
    console.error("🔥 Auto reload failed:", err);
  } finally {
    isReloading = false;
  }
}

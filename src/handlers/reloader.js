import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function freshImport(filePath) {
  const fileUrl = pathToFileURL(filePath).href;
  return import(`${fileUrl}?update=${Date.now()}`);
}

function safeReadDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

/* ================= COMMANDS ================= */
/* Uses YOUR commands Map */
export async function reloadCommands(commands) {
  // 🔒 HARD SAFETY CHECK
  if (!(commands instanceof Map)) {
    console.warn(
      "[reloadCommands] Aborted: commands is not a Map. Type:",
      commands?.constructor?.name
    );
    return;
  }

  const dir = path.join(__dirname, "../commands");

  for (const file of safeReadDir(dir)) {
    if (!file.endsWith(".js")) continue;

    try {
      const filePath = path.join(dir, file);
      const { default: command } = await freshImport(filePath);
      if (!command) continue;

      const name = file.replace(".js", "");
      commands.set(name, command);
    } catch (err) {
      console.error(`[reloadCommands] Failed: ${file}`, err);
    }
  }
}

/* ================= CONSTANTS ================= */
export async function reloadConstants() {
  const dir = path.join(__dirname, "../constants");

  for (const file of safeReadDir(dir)) {
    try {
      await freshImport(path.join(dir, file));
    } catch (err) {
      console.error(`[reloadConstants] Failed: ${file}`, err);
    }
  }
}

/* ================= UTILS ================= */
export async function reloadUtils() {
  const dir = path.join(__dirname, "../utils");

  for (const file of safeReadDir(dir)) {
    if (!file.endsWith(".js")) continue;

    try {
      await freshImport(path.join(dir, file));
    } catch (err) {
      console.error(`[reloadUtils] Failed: ${file}`, err);
    }
  }
}

/* ================= STATE ================= */
export async function reloadState() {
  const dir = path.join(__dirname, "../state");

  // 🔒 You do not have a state folder — skip safely
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const file of safeReadDir(dir)) {
    if (!file.endsWith(".js")) continue;

    try {
      const filePath = path.join(dir, file);
      const mod = await freshImport(filePath);

      // Optional lifecycle hook ONLY if it exists
      if (typeof mod.initState === "function") {
        mod.initState();
      }
    } catch (err) {
      console.error(`[reloadState] Failed: ${file}`, err);
    }
  }
}


/* ================= EVENTS ================= */
/* DOES NOT touch messageCreate (matches your logic) */
export async function reloadEvents(client) {
  const dir = path.join(__dirname, "../events");

  for (const file of safeReadDir(dir)) {
    if (!file.endsWith(".js")) continue;

    const eventName = file.replace(".js", "");
    if (eventName === "messageCreate") continue;

    try {
      const filePath = path.join(dir, file);
      const { default: handler } = await freshImport(filePath);

      client.removeAllListeners(eventName);
      client.on(eventName, (...args) => handler(client, ...args));
    } catch (err) {
      console.error(`[reloadEvents] Failed: ${file}`, err);
    }
  }
}

/* ================= MASTER ================= */
export async function loadAll(client, commands) {
  await reloadUtils();
  await reloadConstants();
  await reloadState();
  await reloadCommands(commands);
  await reloadEvents(client);
}

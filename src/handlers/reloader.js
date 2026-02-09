import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------- helpers ---------- */
async function freshImport(filePath) {
  const url = pathToFileURL(filePath).href;
  return import(`${url}?update=${Date.now()}`);
}

function safeReadDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

/* ---------- commands ---------- */
export async function reloadCommands(commands) {
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
      const { default: cmd } = await freshImport(path.join(dir, file));
      if (!cmd) continue;

      commands.set(file.replace(".js", ""), cmd);
    } catch (err) {
      console.error(`[reloadCommands] Failed: ${file}`, err);
    }
  }
}

/* ---------- constants ---------- */
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

/* ---------- utils ---------- */
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

/* ---------- state (optional folder) ---------- */
export async function reloadState() {
  const dir = path.join(__dirname, "../state");
  if (!fs.existsSync(dir)) return;

  for (const file of safeReadDir(dir)) {
    if (!file.endsWith(".js")) continue;

    try {
      const mod = await freshImport(path.join(dir, file));
      if (typeof mod.initState === "function") mod.initState();
    } catch (err) {
      console.error(`[reloadState] Failed: ${file}`, err);
    }
  }
}

/* ---------- interactions ---------- */
export async function reloadInteractions(client, commands) {
  const dir = path.join(__dirname, "../interactions");
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;

    const eventName = file.replace(".js", "");
    const filePath = path.join(dir, file);

    try {
      const { default: handler } = await freshImport(filePath);

      client.removeAllListeners(eventName);

      if (eventName === "messageCreate") {
        client.on(eventName, (msg) =>
          handler(client, msg, commands)
        );
      } else {
        client.on(eventName, (...args) =>
          handler(client, ...args, commands)
        );
      }

      console.log(`🔁 Interaction reloaded: ${eventName}`);
    } catch (err) {
      console.error(`[reloadInteractions] Failed: ${file}`, err);
    }
  }
}

/* ---------- events ---------- */
export async function reloadEvents(client) {
  const dir = path.join(__dirname, "../events");
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;

    const eventName = file.replace(".js", "");
    if (eventName === "messageCreate") continue;

    try {
      const { default: handler } = await freshImport(path.join(dir, file));
      client.removeAllListeners(eventName);
      client.on(eventName, (...args) => handler(client, ...args));
    } catch (err) {
      console.error(`[reloadEvents] Failed: ${file}`, err);
    }
  }
}

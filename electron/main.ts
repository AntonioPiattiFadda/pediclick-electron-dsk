// main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openPorts =  new Map<String, {port: SerialPort, parser: ReadlineParser}>();

// Estructura de builds
process.env.APP_ROOT = path.join(__dirname, "..");

// Vite / rutas
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT!, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT!, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT!, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, "electron-vite.svg"),
    webPreferences: {
      preload: fileURLToPath(new URL("./preload.mjs", import.meta.url)),
    },
  });

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });

  if (VITE_DEV_SERVER_URL) {
    // Add retry mechanism for development server
    let retryCount = 0;
    const maxRetries = 10;
    const loadDevURL = async () => {
      try {
        await win?.loadURL(VITE_DEV_SERVER_URL);
        console.log('Successfully loaded dev server');
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying to load dev server... (${retryCount}/${maxRetries})`);
          setTimeout(loadDevURL, 2000);
        } else {
          console.error('Failed to load dev server after maximum retries, falling back to production build');
          win?.loadFile(path.join(RENDERER_DIST, "index.html"));
        }
      }
    };
    // Wait a bit for Vite to be fully ready
    setTimeout(loadDevURL, 2000);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

ipcMain.handle("serial:list", async () => {
  try {
    const ports = await SerialPort.list();
    return { ok: true, ports };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
});

ipcMain.handle("serial:open", async (event, opts: { path: string; baudRate?: number }) => {
  const { path, baudRate = 9600 } = opts;
  if (openPorts.has(path)) return { ok: true, message: "already open" };

  try {
    const port = new SerialPort({ path, baudRate, autoOpen: false });
    const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    parser.on("data", (line: string) => {
      event.sender.send("serial:data", { path, data: line });
    });

    port.on("error", (err) => {
      event.sender.send("serial:error", { path, error: err.message });
    });

    port.on("close", () => {
      event.sender.send("serial:closed", { path });
      openPorts.delete(path);
    });

    await new Promise<void>((resolve, reject) => {
      port.open((err) => (err ? reject(err) : resolve()));
    });

    openPorts.set(path, { port, parser });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
});

ipcMain.handle("serial:close", async (_event, path: string) => {
  const entry = openPorts.get(path);
  if (!entry) return { ok: false, error: "not open" };
  try {
    await new Promise<void>((resolve, reject) => {
      entry.port.close((err) => (err ? reject(err) : resolve()));
    });
    openPorts.delete(path);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
});



app.on("before-quit", () => {
  for (const { port } of openPorts.values()) {
    try { port.close(); } catch { /* ignore */ }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.whenReady().then(createWindow);

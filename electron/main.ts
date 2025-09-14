// main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SerialPort } from "serialport";
import { usb } from "usb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const listSerialPorts = async () => {
  try {
    const ports = await SerialPort.list();
    console.log("Available Serial Ports:", ports);
  } catch (error) {
    console.error("Error listing serial ports:", error);
  }
};

const listUsbDevices = () => {
  try {
    const devices = usb.getDeviceList();
    console.log("Available USB Devices:", devices);
  } catch (error) {
    console.error("Error listing USB devices:", error);
  }
};

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

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

ipcMain.handle("list-serial-ports", async () => {
  const ports = await SerialPort.list();
  return ports;
});

ipcMain.handle("list-usb-devices", async () => {
  const devices = usb.getDeviceList();
  return devices;
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

app.whenReady().then(() => {
  createWindow();
  listUsbDevices();
  listSerialPorts();
});

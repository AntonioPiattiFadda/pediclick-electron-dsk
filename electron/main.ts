// main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SerialPort } from "serialport";
import { usb } from "usb";
import { exec } from "child_process";
import { promisify } from "util";

// Agregar estas importaciones al inicio de main.ts
import os from "os";
import fs from "fs";
const execAsync = promisify(exec);

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

// -----------------
// HOTSPOT
// -----------------

// function execAsync(
//   command: string
// ): { stdout: any } | PromiseLike<{ stdout: any }> {
//   throw new Error("Function not implemented.");
// }

// 3. FUNCIÓN PARA CREAR HOTSPOT
ipcMain.handle(
  "create-hotspot",
  async (_event, { ssid, password, interface: networkInterface }) => {
    try {
      const platform = os.platform();
      let command = "";

      // Valores por defecto
      const hotspotSSID = ssid || "MyHotspot";
      const hotspotPassword = password || "password123";

      switch (platform) {
        case "win32":
          // eslint-disable-next-line no-case-declarations
          const psCommand = `
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime]::CreateFromConnectionProfile(([Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]::GetInternetConnectionProfile()))
    $tetheringManager.StartTetheringAsync() | Out-Null
  `;
          await execAsync(`powershell -Command "${psCommand}"`);
          break;

        case "darwin": // macOS
          // macOS - usar sharing preferences (requiere permisos de admin)
          command = `sudo networksetup -createnetworkservice "Hotspot" "bridge100"`;
          await execAsync(command);
          break;

        case "linux":
          // Linux - usar hostapd y crear access point
          // eslint-disable-next-line no-case-declarations
          const configContent = `interface=${networkInterface || "wlan0"}
driver=nl80211
ssid=${hotspotSSID}
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${hotspotPassword}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP`;

          // Escribir configuración temporal
          // eslint-disable-next-line no-case-declarations
          const configPath = "/tmp/hostapd.conf";
          fs.writeFileSync(configPath, configContent);

          // Iniciar hotspot
          await execAsync(`sudo hostapd ${configPath} &`);
          break;

        default:
          throw new Error(`Plataforma no soportada: ${platform}`);
      }

      return {
        success: true,
        message: `Hotspot '${hotspotSSID}' creado exitosamente`,
        ssid: hotspotSSID,
        password: hotspotPassword,
      };
    } catch (error) {
      console.error("Error creating hotspot:", error);
      return {
        success: false,
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error),
      };
    }
  }
);

// 4. FUNCIÓN PARA DETENER HOTSPOT
ipcMain.handle("stop-hotspot", async () => {
  try {
    const platform = os.platform();

    switch (platform) {
      case "win32":
        await execAsync("netsh wlan stop hostednetwork");
        break;
      case "linux":
        await execAsync("sudo pkill hostapd");
        break;
      case "darwin":
        // macOS logic here
        break;
    }

    return {
      success: true,
      message: "Hotspot detenido exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// -----------------
// Servidor Express
// -----------------
const expressApp = express();
const PORT = 3000;

// Middleware JSON
expressApp.use(express.json());

// Ejemplo de endpoint
expressApp.get("/api/hello", (_req, res) => {
  res.json({ message: "Hola desde Express en Electron 🚀" });
});

expressApp.post("/api/hello", (_req, res) => {
  res.json({ message: "Hola desde Express en Electron 🚀" });
});

// Iniciar servidor
expressApp.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});

app.whenReady().then(() => {
  createWindow();
  listUsbDevices();
  listSerialPorts();
});

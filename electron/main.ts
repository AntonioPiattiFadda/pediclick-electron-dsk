// main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Agregar estas importaciones al inicio de main.ts
import { print } from "./printerManager";
import { closeAllPorts, closeSerialPort, listSerialPorts, openSerialPort } from "./serialManager";
import { listUsbDevices } from "./usbManager";
import { connectToScale } from "./scaleManager";

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

// const listSerialPorts = async () => {
//   try {
//     const ports = await SerialPort.list();
//     console.log("Available Serial Ports:", ports);
//   } catch (error) {
//     console.error("Error listing serial ports:", error);
//   }
// };

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, "electron-vite.svg"),
    fullscreen: true,
    // width: 800,
    // height: 300,
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

//Serial Ports IPC Handlers
ipcMain.handle("list-serial-ports", () => listSerialPorts());
ipcMain.handle("connect-serial-ports", (event, opts) => openSerialPort(event, opts));
ipcMain.handle("close-serial-ports", (_event, path) => closeSerialPort(path));
ipcMain.handle("close-all-serial-ports", () => closeAllPorts());

//USB Devices IPC Handlers
ipcMain.handle("list-usb-devices", () => listUsbDevices());

// Printer IPC Handlers
ipcMain.handle("print", (_event, vendorId, productId, printFunction, printContent) => {
  print(vendorId, productId, printFunction, printContent);
});

// Scale IPC Handlers
ipcMain.handle("connect-scale", (_, portPath, config) => {
  connectToScale(portPath, config);
});

// const openPorts = new Map<
//   string,
//   { port: SerialPort; parser: ReadlineParser }
// >();

// ipcMain.handle(
//   "serial:open",
//   async (event, opts: { path: string; baudRate?: number }) => {
//     console.log("Opening port:", event, opts);

//     const { path, baudRate = 9600 } = opts;
//     if (openPorts.has(path)) return { ok: true, message: "already open" };

//     try {
//       const port = new SerialPort(opts);
//       console.log("Opening port:", port);
//       // const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
//       // console.log("Parser set up for port:", parser);

//       port.on("open", () => {
//         // Enviar comando para solicitar peso (común en balanzas)
//         console.log("Envie el comando:");

//         port.write(Buffer.from([0x05])); // ENQ
//       });

//       port.on("data", (chunk: Buffer) => {
//         console.log("Raw buffer:", chunk);
//         console.log("As string:", chunk.toString("utf8"));
//       });

//       port.on("data", (line: string) => {
//         console.log(`Data from ${path}:`, line);
//         event.sender.send("serial:data", { path, data: line });
//       });

//       port.on("error", (err) => {
//         console.log(`Error from ${path}:`, err.message);
//         event.sender.send("serial:error", { path, error: err.message });
//       });

//       port.on("close", () => {
//         console.log(`Closed port:`, port);
//         event.sender.send("serial:closed", { path });
//         openPorts.delete(path);
//       });

//       await new Promise<void>((resolve, reject) => {
//         port.open((err) => (err ? reject(err) : resolve()));
//       });

//       const monitorInterval = setInterval(() => {
//         if (port.isOpen) {
//           port.write("W\r\n"); // Solicitar peso cada cierto tiempo
//         } else {
//           clearInterval(monitorInterval);
//         }
//       }, 50); // Cada 1 segundo

//       openPorts.set(path, { port });
//       return { ok: true };
//     } catch (err: any) {
//       console.log("Error opening port:", err);
//       return { ok: false, error: err?.message ?? String(err) };
//     }
//   }
// );

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

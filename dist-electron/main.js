import { ipcMain as i, app as r, BrowserWindow as n } from "electron";
import s from "node:path";
import { fileURLToPath as l } from "node:url";
import { SerialPort as c } from "serialport";
import { usb as a } from "usb";
const m = l(import.meta.url), v = s.dirname(m);
process.env.APP_ROOT = s.join(v, "..");
const t = process.env.VITE_DEV_SERVER_URL, h = s.join(process.env.APP_ROOT, "dist-electron"), p = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = t ? s.join(process.env.APP_ROOT, "public") : p;
let o = null;
const _ = async () => {
  try {
    const e = await c.list();
    console.log("Available Serial Ports:", e);
  } catch (e) {
    console.error("Error listing serial ports:", e);
  }
}, R = () => {
  try {
    const e = a.getDeviceList();
    console.log("Available USB Devices:", e);
  } catch (e) {
    console.error("Error listing USB devices:", e);
  }
};
function d() {
  o = new n({
    icon: s.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: l(new URL("./preload.mjs", import.meta.url))
    }
  }), o.webContents.on("did-finish-load", () => {
    o == null || o.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), t ? o.loadURL(t) : o.loadFile(s.join(p, "index.html"));
}
i.handle("list-serial-ports", async () => await c.list());
i.handle("list-usb-devices", async () => a.getDeviceList());
r.on("window-all-closed", () => {
  process.platform !== "darwin" && (r.quit(), o = null);
});
r.on("activate", () => {
  n.getAllWindows().length === 0 && d();
});
r.whenReady().then(() => {
  d(), R(), _();
});
export {
  h as MAIN_DIST,
  p as RENDERER_DIST,
  t as VITE_DEV_SERVER_URL
};

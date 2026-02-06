import { ipcRenderer, contextBridge } from "electron";
import { bufferFunctions } from "./printerManager";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("serial", {
  list: () => ipcRenderer.invoke("list-serial-ports"),
  close: (selectedPort: string) => ipcRenderer.invoke("close-serial-port", selectedPort),
  closeAll: () => ipcRenderer.invoke("close-all-serial-ports"),
});


contextBridge.exposeInMainWorld("usb", {
  list: () => ipcRenderer.invoke("list-usb-devices"),
});

contextBridge.exposeInMainWorld("printer", {
  print: (vendorId: number, productId: number, printFunction: keyof typeof bufferFunctions, printContent?: unknown) => ipcRenderer.invoke("print", vendorId, productId, printFunction, printContent),
});

contextBridge.exposeInMainWorld("scale", {
  connectScale: (portPath: string) => ipcRenderer.invoke("connect-scale", portPath),
  // serialOpen: (opts: { path: string; baudRate?: number }) => ipcRenderer.invoke("serial:open", opts),
});

contextBridge.exposeInMainWorld("scaleAPI", {
  onWeight: (callback: (data: {
    weight: string;
    isScaleConnected: boolean;
    isScaleError: boolean;
  }) => void) => {
    ipcRenderer.on("scale-weight", (_event, data) => {
      callback(data);
    });
  },
});


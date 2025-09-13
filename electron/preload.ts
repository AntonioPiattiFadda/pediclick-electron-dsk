import { ipcRenderer, contextBridge,IpcRendererEvent } from "electron";

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
  list: () => ipcRenderer.invoke("serial:list"),
  open: (opts: any) => ipcRenderer.invoke("serial:open", opts),
  close: (path: string) => ipcRenderer.invoke("serial:close", path),

  onData: (cb: (payload: { path: string; data: string }) => void) => {
    const listener = (_: IpcRendererEvent, payload: any) => cb(payload);
    ipcRenderer.on("serial:data", listener);
    return () => ipcRenderer.removeListener("serial:data", listener);
  },

  onError: (cb: (payload: any) => void) => {
    const listener = (_: IpcRendererEvent, payload: any) => cb(payload);
    ipcRenderer.on("serial:error", listener);
    return () => ipcRenderer.removeListener("serial:error", listener);
  },

  onClosed: (cb: (payload: any) => void) => {
    const listener = (_: IpcRendererEvent, payload: any) => cb(payload);
    ipcRenderer.on("serial:closed", listener);
    return () => ipcRenderer.removeListener("serial:closed", listener);
  },
});

// Optional TypeScript global declaration
declare global {
  interface Window {
    serial: {
      list: () => Promise<any>;
      open: (opts: any) => Promise<any>;
      close: (path: string) => Promise<any>;
      onData: (cb: (p: any) => void) => () => void;
      onError: (cb: (p: any) => void) => () => void;
      onClosed: (cb: (p: any) => void) => () => void;
    };
  }
}
import { bufferFunctions } from "electron/printerManager";

export { };

declare global {
  interface Window {
    serial: {
      list: () => Promise<unknown[]>;
      open: (opts: { path: string; baudRate?: number }) => Promise<unknown>;
      close: (selectedPort: string) => Promise<unknown>;
      closeAll: () => Promise<unknown>;
    };
    usb: {
      list: () => Promise<unknown[]>;
    };
    printer: {
      print: (vendorId: number, productId: number, printFunction: keyof typeof bufferFunctions, printContent?: unknown) => Promise<void>;
    };
    scale: {
      connectScale: (portPath: string, config?: object) => Promise<void>;
    };
    scaleAPI: {
      onWeight: (
        cb: (data: {
          weight: string;
          isScaleConnected: boolean;
          isScaleError: boolean;
        }) => void
      ) => void;
    };
    // hotspot: {
    //   createHotspot: (options: {
    //     ssid?: string;
    //     password?: string;
    //     interface?: string;
    //   }) => Promise<{ success: boolean; message: string }>;
    //   stopHotspot: () => Promise<{ success: boolean; message: string }>;
    // };
  }
}



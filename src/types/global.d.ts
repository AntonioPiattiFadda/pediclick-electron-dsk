import { bufferFunctions } from "electron/printerManager";
import { PrintPayload } from "./printer";

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
      print: (vendorId: number, productId: number, printFunction: keyof typeof bufferFunctions, printContent?: PrintPayload) => Promise<void>;
      checkConnection: (vendorId: number, productId: number) => Promise<{ success: boolean; error?: string }>;
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
    mercadoPago: {
      listPointDevices: () => Promise<unknown>;
      createPointIntent: (
        amount: number,
        description: string,
        externalRef: string,
      ) => Promise<{
        id?: string;
        state?: string;
        amount?: number;
        error?: string;
        message?: string;
        [k: string]: unknown;
      }>;
      cancelPointIntent: () => Promise<{ success?: boolean; [k: string]: unknown }>;
      checkPointIntent: (intentId: string) => Promise<{
        id?: string;
        state?: string;
        payment?: { total_paid_amount?: number; [k: string]: unknown };
        [k: string]: unknown;
      }>;
      createQROrder: (
        items: {
          product_id: number;
          product_name: string;
          quantity: number;
          price: number;
          total_price: number;
        }[],
        totalAmount: number,
        externalRef: string,
      ) => Promise<{
        order_id?: string | null;
        qr_image?: string | null;
        error?: string;
        message?: string;
        [k: string]: unknown;
      }>;
      checkQROrder: (orderId: string) => Promise<{
        id?: string;
        status?: string;
        transactions?: {
          payments?: { id?: string; amount?: string; status?: string }[];
        };
        [k: string]: unknown;
      }>;
      cancelQROrder: (orderId: string) => Promise<{ success?: boolean; [k: string]: unknown }>;
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



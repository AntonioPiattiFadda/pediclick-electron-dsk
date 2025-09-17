export {};

declare global {
  interface Window {
    serial: {
      list: () => Promise<unknown[]>;
    };
    usb: {
      list: () => Promise<unknown[]>;
    };
  }
}

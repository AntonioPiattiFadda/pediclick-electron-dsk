export type DevicesStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "loading"
  | "connecting";


export type Scale = {
  path: string,
  manufacturer: string,
  serialNumber: string,
  pnpId: string,
  locationId: string,
  friendlyName: string,
  vendorId: string,
  productId: string
}

export type USBDeviceType = {
  busNumber: number;
  deviceAddress: number;
  deviceDescriptor: {
    bLength: number;
    bDescriptorType: number;
    bcdUSB: number;
    bDeviceClass: number;
    bDeviceSubClass: number;
    bDeviceProtocol: number;
    bMaxPacketSize0: number;
    idVendor: number;
    idProduct: number;
    bcdDevice: number;
    iManufacturer: number;
    iProduct: number;
    iSerialNumber: number;
    bNumConfigurations: number;
  };
  portNumbers: number[];
}
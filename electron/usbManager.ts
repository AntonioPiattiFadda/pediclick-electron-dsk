import { usb } from "usb";

export const listUsbDevices = () => {
    try {
        const devices = usb.getDeviceList();
        return devices;
    } catch (error) {
        console.error("Error listing USB devices:", error);
    }
};
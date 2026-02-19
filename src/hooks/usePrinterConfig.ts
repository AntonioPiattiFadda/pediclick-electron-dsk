import { useState, useEffect } from "react";
import { DevicesStatus, USBDeviceType } from "@/types/devices";

const STORAGE_KEY = "printer_config";

export type PrinterConfig = {
    vendorId: number;
    productId: number;
};

export const getPrinterConfig = (): PrinterConfig | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        return JSON.parse(saved) as PrinterConfig;
    } catch {
        return null;
    }
};

const usePrinterConfig = () => {
    const [status, setStatus] = useState<DevicesStatus>("disconnected");
    const [availableDevices, setAvailableDevices] = useState<USBDeviceType[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<USBDeviceType | null>(null);

    // Fetch USB devices on mount
    useEffect(() => {
        window.usb.list().then((devices) => {
            setAvailableDevices(devices as USBDeviceType[]);
        }).catch(console.error);
    }, []);

    // Auto-connect on mount if saved config exists
    useEffect(() => {
        const config = getPrinterConfig();
        if (!config) return;

        setStatus("connecting");
        window.printer.checkConnection(config.vendorId, config.productId)
            .then((result) => {
                setStatus(result.success ? "connected" : "error");
            })
            .catch(() => setStatus("error"));
    }, []);

    // Auto-select saved device once device list loads
    useEffect(() => {
        if (availableDevices.length === 0) return;
        const config = getPrinterConfig();
        if (!config) return;

        const match = availableDevices.find(
            (d) =>
                d.deviceDescriptor.idVendor === config.vendorId &&
                d.deviceDescriptor.idProduct === config.productId
        );
        if (match) setSelectedDevice(match);
    }, [availableDevices]);

    const handleConnect = async () => {
        if (!selectedDevice) return;

        const vendorId = selectedDevice.deviceDescriptor.idVendor;
        const productId = selectedDevice.deviceDescriptor.idProduct;

        setStatus("connecting");
        try {
            const result = await window.printer.checkConnection(vendorId, productId);
            if (result.success) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ vendorId, productId }));
                setStatus("connected");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    const handleTest = () => {
        if (!selectedDevice) return;
        const vendorId = selectedDevice.deviceDescriptor.idVendor;
        const productId = selectedDevice.deviceDescriptor.idProduct;
        window.printer.print(vendorId, productId, "printTest");
    };

    const handleRefreshDevices = () => {
        window.usb.list().then((devices) => {
            setAvailableDevices(devices as USBDeviceType[]);
        }).catch(console.error);
    };

    return {
        status,
        availableDevices,
        selectedDevice,
        setSelectedDevice,
        handleConnect,
        handleTest,
        handleRefreshDevices,
    };
};

export default usePrinterConfig;

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusDisplay } from "@/components/hardware/statusDisplay";
import usePrinterConfig from "@/hooks/usePrinterConfig";
import { USBDeviceType } from "@/types/devices";
import { Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const deviceLabel = (device: USBDeviceType) => {
    const { idVendor, idProduct } = device.deviceDescriptor;
    return `${idVendor}:${idProduct}`;
};

const deviceKey = (device: USBDeviceType) =>
    `${device.deviceDescriptor.idVendor}:${device.deviceDescriptor.idProduct}:${device.busNumber}:${device.deviceAddress}`;

const PrinterStatusPopover = () => {
    const {
        status,
        availableDevices,
        selectedDevice,
        setSelectedDevice,
        handleConnect,
        handleTest,
        handleRefreshDevices,
    } = usePrinterConfig();

    const selectedKey = selectedDevice ? deviceKey(selectedDevice) : undefined;

    const onSelectChange = (key: string) => {
        const device = availableDevices.find((d) => deviceKey(d) === key) ?? null;
        setSelectedDevice(device);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <Printer className="h-4 w-4" />
                    <StatusDisplay status={status} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Impresora USB</span>
                        <StatusDisplay status={status} />
                    </div>

                    <div className="flex gap-2">
                        <Select value={selectedKey} onValueChange={onSelectChange}>
                            <SelectTrigger className="flex-1 text-xs">
                                <SelectValue placeholder="Seleccionar dispositivo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableDevices.length === 0 && (
                                    <SelectItem value="__none__" disabled>
                                        No hay dispositivos USB
                                    </SelectItem>
                                )}
                                {availableDevices.map((device) => (
                                    <SelectItem key={deviceKey(device)} value={deviceKey(device)}>
                                        <span className="font-mono">Usb: {deviceLabel(device)}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefreshDevices}
                            title="Actualizar lista"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            className="flex-1"
                            onClick={handleConnect}
                            disabled={!selectedDevice || status === "connecting"}
                        >
                            {status === "connecting" ? "Conectando..." : "Conectar"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                handleTest();
                                toast.info("Página de prueba enviada a la impresora");
                            }}
                            disabled={!selectedDevice}
                            title="Imprimir página de prueba"
                        >
                            Test
                        </Button>
                    </div>

                    {selectedDevice && (
                        <p className="text-xs text-muted-foreground">
                            Bus {selectedDevice.busNumber} · Addr {selectedDevice.deviceAddress} · {deviceLabel(selectedDevice)}
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default PrinterStatusPopover;

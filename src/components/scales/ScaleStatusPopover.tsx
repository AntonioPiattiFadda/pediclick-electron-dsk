import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusDisplay } from "@/components/statusDisplay";
import { useScaleContext } from "@/context/ScaleContext";
import useScaleConfig from "@/hooks/useScaleConfig";
import { DevicesStatus } from "@/types/devices";
import { Scale, RefreshCw } from "lucide-react";

const ScaleStatusPopover = () => {
    const { isScaleConnected, isScaleError } = useScaleContext();
    const {
        availablePorts,
        selectedPort,
        setSelectedPort,
        isConnecting,
        handleConnect,
        handleRefreshPorts,
    } = useScaleConfig();

    const status: DevicesStatus = isConnecting
        ? "connecting"
        : isScaleConnected
            ? "connected"
            : isScaleError
                ? "error"
                : "disconnected";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <Scale className="h-4 w-4" />
                    <StatusDisplay status={status} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-fit min-w-100" align="end">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Balanza</span>
                        <StatusDisplay status={status} />
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={selectedPort?.path ?? ""}
                            onValueChange={(path) => {
                                const port = availablePorts.find((p) => p.path === path) ?? null;
                                setSelectedPort(port);
                            }}
                        >
                            <SelectTrigger className="flex-1 text-xs">
                                <SelectValue placeholder="Seleccionar puerto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePorts.length === 0 && (
                                    <SelectItem value="__none__" disabled>
                                        No hay puertos serie
                                    </SelectItem>
                                )}
                                {availablePorts.map((port) => (
                                    <SelectItem key={port.path} value={port.path}>
                                        {port.friendlyName ?? port.path}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefreshPorts}
                            title="Actualizar lista"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={handleConnect}
                        disabled={!selectedPort || isConnecting}
                    >
                        {isConnecting ? "Conectando..." : "Conectar"}
                    </Button>

                    {selectedPort && (
                        <p className="text-xs text-muted-foreground">
                            {selectedPort.path}
                            {selectedPort.manufacturer ? ` · ${selectedPort.manufacturer}` : ""}
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ScaleStatusPopover;

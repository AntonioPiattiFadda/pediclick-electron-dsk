import { useState, useEffect } from "react";
import { Scale } from "@/types/devices";
import { toast } from "sonner";

const STORAGE_KEY = "scale_config";

export type ScaleConfig = { path: string };

export const getScaleConfig = (): ScaleConfig | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        return JSON.parse(saved) as ScaleConfig;
    } catch {
        return null;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseScaleList = (data: unknown): Scale[] => {
    if (Array.isArray(data)) return data as Scale[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (data && typeof data === "object" && "ports" in data) return ((data as any).ports ?? []) as Scale[];
    return [];
};

const useScaleConfig = () => {
    const [availablePorts, setAvailablePorts] = useState<Scale[]>([]);
    const [selectedPort, setSelectedPort] = useState<Scale | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Fetch serial ports on mount
    useEffect(() => {
        window.serial.list().then((data) => {
            setAvailablePorts(parseScaleList(data));
        }).catch(console.error);
    }, []);

    // Auto-connect on mount if saved config exists
    useEffect(() => {
        const config = getScaleConfig();
        if (!config) return;
        setIsConnecting(true);
        toast.loading("Reconectando balanza...", { id: "scale-connect" });
        window.scale.connectScale(config.path).finally(() => {
            setIsConnecting(false);
            toast.dismiss("scale-connect");
        });
    }, []);

    // Auto-select saved port once port list loads
    useEffect(() => {
        if (availablePorts.length === 0) return;
        const config = getScaleConfig();
        if (!config) return;
        const match = availablePorts.find((p) => p.path === config.path) ?? null;
        if (match) setSelectedPort(match);
    }, [availablePorts]);

    const handleConnect = () => {
        if (!selectedPort) return;
        setIsConnecting(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ path: selectedPort.path }));
        toast.loading("Conectando balanza...", { id: "scale-connect" });
        window.scale.connectScale(selectedPort.path).finally(() => {
            setIsConnecting(false);
            toast.dismiss("scale-connect");
            toast.info("Señal enviada a la balanza", { description: selectedPort.path });
        });
    };

    const handleRefreshPorts = () => {
        window.serial.list().then((data) => {
            const ports = parseScaleList(data);
            setAvailablePorts(ports);
            toast.info(`${ports.length} puerto${ports.length !== 1 ? "s" : ""} serie encontrado${ports.length !== 1 ? "s" : ""}`);
        }).catch(() => toast.error("Error al listar puertos serie"));
    };

    return {
        availablePorts,
        selectedPort,
        setSelectedPort,
        isConnecting,
        handleConnect,
        handleRefreshPorts,
    };
};

export default useScaleConfig;

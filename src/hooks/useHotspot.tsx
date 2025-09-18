import { useState } from "react";

declare global {
  interface Window {
    hotspot: {
      createHotspot: (config: HotspotConfig) => Promise<HotspotResult>;
    };
    electron: {
      stopHotspot: () => Promise<HotspotResult>;
    };
  }
}

interface HotspotResult {
  success: boolean;
  ssid?: string;
  password?: string;
  error?: string;
}

interface HotspotConfig {
  ssid: string;
  password: string;
  interface: string;
}

interface UseHotspotReturn {
  loading: boolean;
  status: "inactive" | "active" | "error";
  createHotspot: (config: HotspotConfig) => Promise<void>;
  stopHotspot: () => Promise<void>;
  error: string | null;
  currentHotspot: HotspotResult | null;
}

export function useHotspot(): UseHotspotReturn {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"inactive" | "active" | "error">(
    "inactive"
  );
  const [error, setError] = useState<string | null>(null);
  const [currentHotspot, setCurrentHotspot] = useState<HotspotResult | null>(
    null
  );

  const createHotspot = async (config: HotspotConfig) => {
    setLoading(true);
    setError(null);

    try {
      const result: HotspotResult = await window.hotspot.createHotspot(config);
      if (import.meta.env.DEV) console.log("Hotspot result:", result);

      if (result.success) {
        setStatus("active");
        setCurrentHotspot(result);
      } else {
        setStatus("error");
        setError(result.error || "Error al crear hotspot");
      }
    } catch (err) {
      setStatus("error");
      setError("Error al comunicarse con el sistema");
    } finally {
      setLoading(false);
    }
  };

  const stopHotspot = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electron.stopHotspot();

      if (result.success) {
        setStatus("inactive");
        setCurrentHotspot(null);
      } else {
        setStatus("error");
        setError(result.error || "Error al detener hotspot");
      }
    } catch (err) {
      setStatus("error");
      setError("Error al comunicarse con el sistema");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    status,
    createHotspot,
    stopHotspot,
    error,
    currentHotspot,
  };
}

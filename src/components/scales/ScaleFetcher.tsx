import { useEffect, useState } from "react";
import ScaleSelector from "./ScaleSelector";
import { DevicesStatus } from "../../types/devices";

const ScaleFetcher = () => {
  const [status, setStatus] = useState<DevicesStatus>("disconnected");
  const [availableScales, setAvailableScales] = useState<string[]>([]);
  const [selectedScale, setSelectedScale] = useState<string | null>(null);
  const [scaleWeightData, setScaleWeightData] = useState("");

  // List ports on mount
  useEffect(() => {
    const fetchScales = async () => {
      setStatus("loading");
      try {
        const api = (window as any).serial;
        if (api?.list) {
          const res = await api.list();
          if (res?.ok && Array.isArray(res.ports)) {
            const ports: string[] = res.ports.map((p: any) => p?.path ?? String(p));
            setAvailableScales(ports);
            setStatus("disconnected");
            return;
          }
        }
        // Fallback demo data if preload is not available
        await new Promise((r) => setTimeout(r, 300));
        setAvailableScales(["Scale A", "Scale B", "Scale C"]);
        setStatus("disconnected");
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    };
    fetchScales();
  }, []);

  // Subscribe to data/error/closed for the selected port
  useEffect(() => {
    if (!selectedScale) return;
    const api = (window as any).serial;
    const offData = typeof api?.onData === "function" ? api.onData((payload: any) => {
      if (payload?.path === selectedScale) {
        setScaleWeightData(String(payload.data ?? ""));
      }
    }) : undefined;
    const offError = typeof api?.onError === "function" ? api.onError((payload: any) => {
      if (payload?.path === selectedScale) {
        setStatus("error");
      }
    }) : undefined;
    const offClosed = typeof api?.onClosed === "function" ? api.onClosed((payload: any) => {
      if (payload?.path === selectedScale) {
        setStatus("disconnected");
      }
    }) : undefined;
    return () => {
      if (typeof offData === "function") offData();
      if (typeof offError === "function") offError();
      if (typeof offClosed === "function") offClosed();
    };
  }, [selectedScale]);

  const connectScale = async () => {
    if (!selectedScale) return;
    setStatus("connecting");
    try {
      const res = await (window as any).serial?.open?.({ path: selectedScale, baudRate: 9600 });
      if (res?.ok) {
        setStatus("connected");
      } else {
        setStatus("error");
        if (res?.error) console.error(res.error);
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const disconnectScale = async () => {
    if (!selectedScale) return;
    try {
      const res = await (window as any).serial?.close?.(selectedScale);
      if (res?.ok) {
        setStatus("disconnected");
      } else {
        setStatus("error");
        if (res?.error) console.error(res.error);
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  return (
    <>
      <ScaleSelector
        availableScales={availableScales}
        selectedScale={selectedScale}
        setSelectedScale={setSelectedScale}
        status={status}
        disabled={false}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={connectScale}
          disabled={!selectedScale || status === "connected" || status === "connecting"}
          className="button"
        >
          Conectar
        </button>
        <button
          onClick={disconnectScale}
          disabled={status !== "connected"}
          className="button"
        >
          Desconectar
        </button>
      </div>

      <div className="field" style={{ marginTop: 8 }}>
        <label className="muted">Weight</label>
        <input
          type="text"
          value={scaleWeightData}
          placeholder="Peso leído de la balanza"
          readOnly
          className="input"
        />
      </div>
    </>
  );
};

export default ScaleFetcher;

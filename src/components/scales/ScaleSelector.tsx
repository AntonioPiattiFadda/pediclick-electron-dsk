import { useMemo } from "react";
import { DevicesStatus } from "../../types/devices";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ScaleSelectorProps = {
  availableScales: any[];
  selectedScale: string | null;
  setSelectedScale: (scale: string | null) => void;
  disabled?: boolean;
  status: DevicesStatus;
};

const StatusIndicator = ({
  status,
}: {
  status: ScaleSelectorProps["status"];
}) => {
  if (status === "loading") return null;

  const color =
    status === "error"
      ? "bg-red-500"
      : status === "connected"
      ? "bg-green-500"
      : "bg-gray-400";

  return <span className={`inline-block w-3 h-3 rounded-full ${color}`} />;
};

const ScaleSelector = ({
  availableScales,
  selectedScale,
  setSelectedScale,
  disabled,
  status,
}: ScaleSelectorProps) => {
  const borderClass = useMemo(() => {
    if (status === "error") return "border-red-500";
    if (status === "loading") return "border-gray-300";
    return "border-gray-300";
  }, [status]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 250 }}>
      {status === "loading" ? (
        <div className="muted">Buscando balanzas...</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={selectedScale ?? ""}
            onChange={(e) => setSelectedScale(e.target.value || null)}
            disabled={disabled || status === "error"}
            className={`select ${borderClass}`}
          >
            <option value="" disabled>
              Seleccionar balanza
            </option>
            {availableScales.map((scale) => (
              <option
                key={(scale as any).id ?? (scale as any).value ?? scale}
                value={(scale as any).id ?? (scale as any).value ?? scale}
              >
                {(scale as any).label ?? (scale as any).name ?? String(scale)}
              </option>
            ))}
          </select>
          <StatusIndicator status={status} />
        </div>
      )}

      {status === "error" && (
        <p className="muted" style={{ color: "#ef4444" }}>Error al conectar la balanza</p>
      )}
    </div>
  );
};

export default ScaleSelector;

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
    <div className="flex flex-col gap-2 w-[250px]">
      {status === "loading" ? (
        <div className="text-sm text-gray-600">Buscando balanzas...</div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedScale ?? ""}
            onChange={(e) => setSelectedScale(e.target.value || null)}
            disabled={disabled || status === "error"}
            className={`border rounded-md px-3 py-2 flex-1 ${borderClass}`}
          >
            <option value="" disabled>
              Seleccionar Xcale
            </option>
            {availableScales.map((scale) => (
              <option
                key={scale.id ?? scale.value ?? scale}
                value={scale.id ?? scale.value ?? scale}
              >
                {scale.label ?? scale.name ?? String(scale)}
              </option>
            ))}
          </select>
          <StatusIndicator status={status} />
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-500">Error al conectar la balanza</p>
      )}
    </div>
  );
};

export default ScaleSelector;

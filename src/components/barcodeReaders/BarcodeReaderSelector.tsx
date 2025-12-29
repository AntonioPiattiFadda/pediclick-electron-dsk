import { USBDeviceType } from "@/types/devices";
import { useMemo } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type BarcodeSelectorProps = {
  availableBarcodes: USBDeviceType[];
  selectedBarcode: USBDeviceType | null;
  setSelectedBarcode: (barcode: USBDeviceType | null) => void;
  disabled?: boolean;
  status: "idle" | "loading" | "error" | "connected";
};

const StatusIndicator = ({
  status,
}: {
  status: BarcodeSelectorProps["status"];
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

const BarcodeSelector = ({
  availableBarcodes,
  selectedBarcode,
  setSelectedBarcode,
  disabled,
  status,
}: BarcodeSelectorProps) => {
  const borderClass = useMemo(() => {
    if (status === "error") return "border-red-500";
    if (status === "loading") return "border-gray-300";
    return "border-gray-300";
  }, [status]);

  return (
    <div className="flex flex-col gap-2 w-[250px]">
      {status === "loading" ? (
        <div className="text-sm text-gray-600">
          Buscando lector de códigos de barras...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={String(selectedBarcode?.busNumber ?? "")}
            onChange={(e) => {
              const busNumber = Number(e.target.value);
              setSelectedBarcode(availableBarcodes.find(barcode => barcode.busNumber === busNumber) || null);
            }}
            disabled={disabled || status === "error"}
            className={`border rounded-md px-3 py-2 flex-1 ${borderClass}`}
          >
            <option value="" disabled>
              Seleccionar Código de Barras
            </option>
            {availableBarcodes.map((barcode) => (
              <option
                key={String(barcode.busNumber ?? String(barcode))}
                value={String(barcode.busNumber ?? String(barcode))}
              >
                {String(barcode.busNumber ?? String(barcode))}
              </option>
            ))}
          </select>
          <StatusIndicator status={status} />
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-500">
          Error al conectar el lector de códigos de barras
        </p>
      )}
    </div>
  );
};

export default BarcodeSelector;

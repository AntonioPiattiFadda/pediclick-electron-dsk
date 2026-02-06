import { useEffect, useState } from "react";
import BarcodeSelector from "./BarcodeReaderSelector";
import { USBDeviceType } from "@/types/devices";

const BarcodeFetcher = () => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "connected"
  >("loading");
  const [availableBarcodes, setAvailableBarcodes] = useState<USBDeviceType[]>([]);
  const [selectedBarcode, setSelectedBarcode] = useState<USBDeviceType | null>(null);

  useEffect(() => {
    // Simula la búsqueda de lectores de código de barras
    setStatus("loading");
    window.usb.list().then((list) => {
      console.log("Lectores de código de barras encontrados:", list);
      setAvailableBarcodes((list as USBDeviceType[]) ?? []);
      setStatus("connected");
    });
  }, []);

  const [barcodeData, setBarcodeData] = useState("");
  return (
    <>
      <BarcodeSelector
        availableBarcodes={availableBarcodes}
        selectedBarcode={selectedBarcode}
        setSelectedBarcode={setSelectedBarcode}
        status={status}
        disabled={false}
      />

      <input
        type="text"
        value={barcodeData}
        onChange={(e) => setBarcodeData(e.target.value)}
        placeholder="Insertar lo que lee el codigo de barras aquí"
        className="border rounded-md px-3 py-2"
      />
    </>
  );
};

export default BarcodeFetcher;

import { useEffect, useState } from "react";
import BarcodeSelector from "./BarcodeReaderSelector";

const BarcodeFetcher = () => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "connected"
  >("loading");
  const [availableBarcodes, setAvailableBarcodes] = useState<string[]>([]);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);

  useEffect(() => {
    // Simula la búsqueda de lectores de código de barras
    setStatus("loading");
    setTimeout(() => {
      // Simula éxito
      setAvailableBarcodes(["Barcode Reader 1", "Barcode Reader 2"]);
      setStatus("connected");
    }, 2000);
  }, []);

  const [barcodeData, setBarcodeData] = useState("");
  console.log("Selected Barcode:", setBarcodeData);

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
        placeholder="Insertar lo que lee el codigo de barras aquí"
        className="border rounded-md px-3 py-2"
      />
    </>
  );
};

export default BarcodeFetcher;

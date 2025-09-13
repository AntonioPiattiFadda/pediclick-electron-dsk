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

  const [barcodeData] = useState("");

  return (
    <>
      <BarcodeSelector
        availableBarcodes={availableBarcodes}
        selectedBarcode={selectedBarcode}
        setSelectedBarcode={setSelectedBarcode}
        status={status}
        disabled={false}
      />

      <div className="field" style={{ marginTop: 8 }}>
        <label className="muted">Data</label>
        <input
          type="text"
          value={barcodeData}
          placeholder="Lectura del código de barras"
          className="input"
          readOnly
        />
      </div>
    </>
  );
};

export default BarcodeFetcher;

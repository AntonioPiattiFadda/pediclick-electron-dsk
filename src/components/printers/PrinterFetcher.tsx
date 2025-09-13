import { useEffect, useState } from "react";
import { DevicesStatus } from "../../types/devices";
import PrinterSelector from "./PrinterSelector";

const PrinterFetcher = () => {
  const [status, setStatus] = useState<DevicesStatus>("disconnected");
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrinters = async () => {
      setStatus("loading");
      try {
        // Simula la búsqueda de impresoras
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Aquí debería implementarse la lógica real para detectar impresoras
        const printers = ["Impresora A", "Impresora B", "Impresora C"];
        setAvailablePrinters(printers);
        setStatus("disconnected");
      } catch (error) {
        setStatus("error");
      }
    };

    fetchPrinters();
  }, []);

  const handlePrintTicker = () => {
    if (!selectedPrinter) {
      alert("Por favor, selecciona una impresora.");
      return;
    }
    // Aquí iría la lógica real para imprimir en la impresora seleccionada
    // LA impresion deberia ser un ticket de venta de un comercio con una impresora termica.
    alert(`Imprimiendo en ${selectedPrinter}...`);
  };

  return (
    <>
      <PrinterSelector
        availablePrinters={availablePrinters}
        selectedPrinter={selectedPrinter}
        setSelectedPrinter={setSelectedPrinter}
        status={status}
        disabled={false}
      />

      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={handlePrintTicker}
          className="button"
        >
          Imprimir ticket
        </button>
      </div>
    </>
  );
};

export default PrinterFetcher;

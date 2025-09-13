import { useEffect, useState } from "react";
import ScaleSelector from "./ScaleSelector";
import { DevicesStatus } from "../../types/devices";

const ScaleFetcher = () => {
  const [status, setStatus] = useState<DevicesStatus>("disconnected");
  const [availableScales, setAvailableScales] = useState<string[]>([]);
  const [selectedScale, setSelectedScale] = useState<string | null>(null);

  useEffect(() => {
    const fetchScales = async () => {
      setStatus("loading");
      try {
        // Simula la búsqueda de balanzas
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Aquí debería implementarse la lógica real para detectar balanzas
        const scales = ["Balaza A", "Balaza B", "Balaza C"];
        setAvailableScales(scales);
        setStatus("disconnected");
      } catch (error) {
        setStatus("error");
      }
    };

    fetchScales();
  }, []);

  const [scaleWeightData, setScaleWeightData] = useState("");

  console.log("Selected Scale:", setScaleWeightData);

  return (
    <>
      <ScaleSelector
        availableScales={availableScales}
        selectedScale={selectedScale}
        setSelectedScale={setSelectedScale}
        status={status}
        disabled={false}
      />

      <input
        type="text"
        value={scaleWeightData}
        placeholder="Insertar peso de la balanza aquí"
        className="border rounded-md px-3 py-2"
      />
    </>
  );
};

export default ScaleFetcher;

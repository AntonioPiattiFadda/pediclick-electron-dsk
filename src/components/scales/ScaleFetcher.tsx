/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import ScaleSelector from "./ScaleSelector";
import { DevicesStatus, Scale } from "../../types/devices";
import StatusDisplay from "../statusDisplay";
import { Button } from "../ui/button";


const ScaleFetcher = () => {
  const [status, setStatus] = useState<DevicesStatus>("disconnected");
  const [availableScales, setAvailableScales] = useState<Scale[]>([]);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);

  useEffect(() => {
    const fetchScales = async () => {
      try {
        // Simula la búsqueda de balanzas
        window.serial.list().then((data) => {
          console.log("Balanzas encontradas:", data);
          // window.serial.list may return an array of ports or an object with a `ports` array; handle both safely
          if (Array.isArray(data)) {
            setAvailableScales(data as Scale[]);
          } else if (data && typeof data === "object" && "ports" in data) {
            setAvailableScales(((data as any).ports ?? []) as Scale[]);
          } else {
            setAvailableScales([]);
          }
        });
        // Aquí debería implementarse la lógica real para detectar balanzas
        // const scales = ["Balaza A", "Balaza B", "Balaza C"];
        // setAvailableScales(scales);
      } catch (error) {
        console.error("Error al buscar balanzas:", error);
      }
    };

    fetchScales();
  }, []);

  // const [scaleWeightData, setscaleWeightData] = useState("");

  const handleConnectToScale = () => {
    if (!selectedScale) {
      alert("Por favor, selecciona una balanza primero.");
      return;
    }
    setStatus("connecting");
    try {
      window.serial.open({ path: selectedScale.path, baudRate: 9600 }).then((response) => {
        console.log("Respuesta de conexión:", response);
        if ((response as any).ok) {
          setStatus("connected");
        } else {
          setStatus("error");
          alert("Error al conectar con la balanza: " + (response as any).error);
        }
      });

    } catch (error) {
      console.error("Error al conectar con la balanza:", error);
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

      <StatusDisplay status={status} />
      <Button
        onClick={handleConnectToScale}
        size={'icon'}
      >Connect</Button>


    </>
  );
};

export default ScaleFetcher;

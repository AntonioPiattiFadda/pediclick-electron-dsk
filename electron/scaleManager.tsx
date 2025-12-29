/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReadlineParser, SerialPort } from "serialport";

let scalePort: any;
let parser: any;
let isScaleConnected: boolean = false;
console.log("Scale Manager initialized.", isScaleConnected);

// Función para conectar con la balanza (con configuraciones para Argentina)
export const connectToScale = async (portPath: string, config: any = {}) => {
    console.log("Intentando conectar a la balanza en puerto:", portPath);
    try {
        if (scalePort && scalePort.isOpen) {
            scalePort.close();
        }

        // Configuraciones comunes para balanzas argentinas
        const argentinaConfigs = [
            // Systel Croma (más común)
            { baudRate: 9600, dataBits: 8, parity: "none", stopBits: 1 },
            // Kretz Onix
            { baudRate: 4800, dataBits: 8, parity: "none", stopBits: 1 },
            // Yamato
            { baudRate: 9600, dataBits: 7, parity: "even", stopBits: 1 },
            // Toledo/Mettler
            { baudRate: 9600, dataBits: 8, parity: "even", stopBits: 1 },
            // Configuraciones adicionales
            { baudRate: 19200, dataBits: 8, parity: "none", stopBits: 1 },
            { baudRate: 2400, dataBits: 8, parity: "none", stopBits: 1 },
        ];

        const finalConfig = {
            path: portPath,
            ...(argentinaConfigs.find((c) => c.baudRate === config.baudRate) ||
                argentinaConfigs[0]),
            ...config,
        };

        console.log("Intentando conectar con configuración:", finalConfig);

        scalePort = new SerialPort(finalConfig);

        // Parser más flexible para diferentes formatos
        parser = scalePort.pipe(
            new ReadlineParser({
                delimiter: ["\r\n", "\n", "\r"] as any,
                includeDelimiter: false,
            })
        );

        scalePort.on("open", () => {
            console.log("Puerto abierto:", portPath);
            isScaleConnected = true;
            // mainWindow.webContents.send("scale-status", {
            //     connected: true,
            //     port: portPath,
            //     config: finalConfig,
            // });

            // Enviar comando de inicialización si es necesario
            setTimeout(() => {
                // Algunos comandos comunes para balanzas argentinas
                sendScaleCommand("Z"); // Zero/Tara
                sendScaleCommand("P"); // Print/Enviar datos
            }, 1000);
        });

        scalePort.on("error", (error: any) => {
            console.error("Error en puerto serie:", error);
            isScaleConnected = false;
            // mainWindow.webContents.send("scale-status", {
            //     connected: false,
            //     error: error.message,
            // });
        });

        scalePort.on("close", () => {
            console.log("Puerto cerrado");
            isScaleConnected = false;
            // mainWindow.webContents.send("scale-status", { connected: false });
        });

        parser.on("data", (data: any) => {
            // LOGUEO BRUTO DE TODO LO QUE LLEGUE
            console.log("🔴 Dato crudo recibido del puerto:", data);

            const weight = parseScaleData(data.toString().trim());
            if (weight !== null) {
                // mainWindow.webContents.send("weight-update", {
                //     weight: weight.value,
                //     unit: weight.unit,
                //     stable: weight.stable,
                //     raw: data.toString(),
                //     timestamp: new Date().toISOString(),
                // });
            }
        });

        return true;
    } catch (error) {
        console.error("Error conectando a la balanza:", error);
        isScaleConnected = false;
        // mainWindow.webContents.send("scale-status", {
        //     connected: false,
        //     error: error.message,
        // });
        return false;
    }
};

// Función para parsear datos de balanzas comunes en Argentina
const parseScaleData = (data: string) => {
    try {
        const cleanData = data.toString().trim();
        console.log("Datos recibidos:", cleanData);

        // Patrones para balanzas comunes en Argentina
        const patterns = [
            // 1. Systel Croma (muy común): "ST,GS,+001.250kg" o "US,GS,+001.250kg"
            {
                regex: /(ST|US),GS,([+-])(\d{3})\.(\d{3})(kg|g)/i,
                parser: (match: string[]) => ({
                    value: parseFloat(`${match[2]}${match[3]}.${match[4]}`),
                    unit: match[5].toLowerCase(),
                    stable: match[1] === "ST",
                }),
            },

            // 2. Kretz Onix: "  +001.250 kg ST" o "  +001.250 kg US"
            {
                regex: /\s*([+-])(\d{3})\.(\d{3})\s*(kg|g)\s*(ST|US)/i,
                parser: (match: string[]) => ({
                    value: parseFloat(`${match[1]}${match[2]}.${match[3]}`),
                    unit: match[4].toLowerCase(),
                    stable: match[5] === "ST",
                }),
            },

            // 3. Yamato: "N +00.250kg" o "S +00.250kg"
            {
                regex: /([NS])\s*([+-])(\d{2})\.(\d{3})(kg|g)/i,
                parser: (match: string[]) => ({
                    value: parseFloat(`${match[2]}${match[3]}.${match[4]}`),
                    unit: match[5].toLowerCase(),
                    stable: match[1] === "S",
                }),
            },

            // 4. Balanzas genéricas con formato simple: "1.250kg" o "+1.250kg"
            {
                regex: /([+-]?\d+\.?\d*)\s*(kg|g)\s*(ST|STABLE|OK)?/i,
                parser: (match: string[]) => ({
                    value: parseFloat(match[1]),
                    unit: match[2].toLowerCase(),
                    stable: !!(
                        match[3] &&
                        (match[3].toUpperCase() === "ST" ||
                            match[3].toUpperCase() === "STABLE" ||
                            match[3].toUpperCase() === "OK")
                    ),
                }),
            },

            // 5. Solo números (algunas balanzas envían solo el peso): "1250" (en gramos)
            {
                regex: /^([+-]?\d+)$/,
                parser: (match: string[]) => ({
                    value: parseFloat(match[1]) / 1000, // Asumir gramos y convertir a kg
                    unit: "kg",
                    stable: true,
                }),
            },

            // 6. Toledo/Mettler: "S S +001.250 kg"
            {
                regex: /([SU])\s+([SU])\s+([+-])(\d{3})\.(\d{3})\s*(kg|g)/i,
                parser: (match: string[]) => ({
                    value: parseFloat(`${match[3]}${match[4]}.${match[5]}`),
                    unit: match[6].toLowerCase(),
                    stable: match[1] === "S" && match[2] === "S",
                }),
            },

            // 7. Cas/Excell: "ST+001250g" o "US+001250g"
            {
                regex: /(ST|US)([+-])(\d+)(g|kg)/i,
                parser: (match: string[]) => {
                    let value = parseFloat(`${match[2]}${match[3]}`);
                    let unit = match[4].toLowerCase();

                    if (unit === "g") {
                        value = value / 1000;
                        unit = "kg";
                    }

                    return {
                        value: value,
                        unit: unit,
                        stable: match[1] === "ST",
                    };
                },
            },
        ];

        // Intentar cada patrón
        for (const pattern of patterns) {
            const match = cleanData.match(pattern.regex);
            if (match) {
                const result = pattern.parser(match);

                // Convertir gramos a kilos si es necesario
                if (result.unit === "g") {
                    result.value = result.value / 1000;
                    result.unit = "kg";
                }

                // Validar que el peso sea razonable (0-50kg para verdulería)
                if (result.value >= 0 && result.value <= 50) {
                    console.log("Peso parseado:", result);
                    return result;
                }
            }
        }

        // Si no coincide con ningún patrón, intentar extraer solo números
        const numberMatch = cleanData.match(/([+-]?\d+\.?\d*)/);
        if (numberMatch) {
            const value = parseFloat(numberMatch[1]);
            // Si es un número grande, probablemente está en gramos
            const finalValue = value > 50 ? value / 1000 : value;

            if (finalValue >= 0 && finalValue <= 50) {
                return {
                    value: finalValue,
                    unit: "kg",
                    stable: false, // No podemos determinar estabilidad
                };
            }
        }

        return null;
    } catch (error) {
        console.error("Error parseando datos de balanza:", error);
        return null;
    }
};

// Función para desconectar la balanza
// const disconnectScale = () => {
//     if (scalePort && scalePort.isOpen) {
//         scalePort.close();
//     }
// };

// Función para enviar comando a la balanza (si es necesario)
const sendScaleCommand = (command: string) => {
    if (scalePort && scalePort.isOpen) {
        scalePort.write(command + "\r\n");
    }
};



// ─────────────────────────────────────────────
// Constantes SYSSTEL
// ─────────────────────────────────────────────
// const ENQ = 0x05;
// const ACK = 0x06;
// const NACK = 0x15;
// const STX = 0x02;
// const ETX = 0x03;

// ─────────────────────────────────────────────
// CRC (XOR entre STX y ETX inclusive)
// ─────────────────────────────────────────────
// function calculateCRC(buffer: Buffer): number {
//     let crc = 0x00;
//     for (const byte of buffer) crc ^= byte;
//     return crc;
// }

// ─────────────────────────────────────────────
// Parser de frame SYSSTEL
// ─────────────────────────────────────────────
// function parseSysstelFrame(buffer: Buffer): number {
//     const stxIndex = buffer.indexOf(STX);
//     const etxIndex = buffer.indexOf(ETX);

//     if (stxIndex === -1 || etxIndex === -1 || etxIndex <= stxIndex) {
//         throw new Error("Invalid SYSSTEL frame");
//     }

//     const payload = buffer.slice(stxIndex + 1, etxIndex);
//     const receivedCRC = buffer[etxIndex + 1];

//     const calculatedCRC = calculateCRC(
//         buffer.slice(stxIndex, etxIndex + 1)
//     );

//     if (receivedCRC !== calculatedCRC) {
//         throw new Error("CRC mismatch");
//     }

//     const weightStr = payload.toString("ascii").trim();
//     const weight = Number(weightStr);

//     if (Number.isNaN(weight)) {
//         throw new Error("Invalid weight value");
//     }

//     return weight;
// }

// Ejemplo que funciona en otra app
// ipcMain.handle(
//   "serial:open",
//   async (event, opts: { path: string; baudRate?: number }) => {
//     const { path, baudRate = 9600 } = opts;
//     if (openPorts.has(path)) return { ok: true, message: "already open" };

//     try {
//       const port = new SerialPort(opts);
//       console.log("Opening port:", port);
//       // const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
//       // console.log("Parser set up for port:", parser);

//       port.on("open", () => {
//         // Enviar comando para solicitar peso (común en balanzas)
//         port.write(Buffer.from([0x05])); // ENQ
//       });

//       port.on("data", (chunk: Buffer) => {
//         console.log("Raw buffer:", chunk);
//         console.log("As string:", chunk.toString("utf8"));
//       });

//       port.on("data", (line: string) => {
//         console.log(`Data from ${path}:`, line);
//         event.sender.send("serial:data", { path, data: line });
//       });

//       port.on("error", (err) => {
//         console.log(`Error from ${path}:`, err.message);
//         event.sender.send("serial:error", { path, error: err.message });
//       });

//       port.on("close", () => {
//         console.log(`Closed port:`, port);
//         event.sender.send("serial:closed", { path });
//         openPorts.delete(path);
//       });

//       await new Promise<void>((resolve, reject) => {
//         port.open((err) => (err ? reject(err) : resolve()));
//       });

//       const monitorInterval = setInterval(() => {
//         if (port.isOpen) {
//           port.write("W\r\n"); // Solicitar peso cada cierto tiempo
//         } else {
//           clearInterval(monitorInterval);
//         }
//       }, 50); // Cada 1 segundo

//       openPorts.set(path, { port });
//       return { ok: true };
//     } catch (err: any) {
//       console.log("Error opening port:", err);
//       return { ok: false, error: err?.message ?? String(err) };
//     }
//   }
// );


// export function getWeight(
//     opts
// ) => {

//     console.log("Opening serial port with options:", opts);
//     const { path, baudRate = 9600 } = opts;

//     // if (openPorts.has(path)) return { ok: true, message: "already open" };

//     try {
//         const port = new SerialPort({ path, baudRate });
//         const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

//         port.on("open", () => {
//             console.log(`✅ Opened port ${path}`);
//             port.write(Buffer.from([0x05])); // ejemplo: enviar ENQ al abrir
//         });

//         parser.on("data", (line: string) => {
//             console.log(`📩 Data from ${path}:`, line);
//             event.sender.send("serial:data", { path, data: line });
//         });

//         port.on("error", (err) => {
//             console.error(`❌ Error ${path}:`, err.message);
//             event.sender.send("serial:error", { path, error: err.message });
//         });

//         port.on("close", () => {
//             console.log(`🔌 Closed ${path}`);
//             event.sender.send("serial:closed", { path });
//             openPorts.delete(path);
//         });

//         await new Promise<void>((resolve, reject) => {
//             port.open((err) => (err ? reject(err) : resolve()));
//         });

//         // Ejemplo: enviar periódicamente una consulta
//         const monitor = setInterval(() => {
//             if (port.isOpen) port.write("W\r\n");
//             else clearInterval(monitor);
//         }, 1000);

//         // openPorts.set(path, { port, parser });
//         return { ok: true };
//     } catch (err: any) {
//         console.error("Error opening port:", err);
//         return { ok: false, error: err?.message ?? String(err) };
//     }
// };
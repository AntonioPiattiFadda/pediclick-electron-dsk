import { SerialPort } from "serialport";

// const openPorts = new Map<string, { port: SerialPort; parser?: ReadlineParser }>();

export const listSerialPorts = async () => {
    try {
        const ports = await SerialPort.list();
        return { ok: true, ports };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return { ok: false, error: err?.message ?? String(err) };
    }
};

// export const openSerialPort = async (
//     event: Electron.IpcMainInvokeEvent,
//     opts: { path: string; baudRate?: number }
// ) => {
//     console.log("Opening serial port with options:", opts);
//     const { path, baudRate = 9600 } = opts;

//     if (openPorts.has(path)) return { ok: true, message: "already open" };

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

//         openPorts.set(path, { port, parser });
//         return { ok: true };
//     } catch (err: any) {
//         console.error("Error opening port:", err);
//         return { ok: false, error: err?.message ?? String(err) };
//     }
// };

// export const closeSerialPort = async (path: string) => {
//     const entry = openPorts.get(path);
//     if (!entry) return { ok: false, error: "not open" };

//     try {
//         await new Promise<void>((resolve, reject) => {
//             entry.port.close((err) => (err ? reject(err) : resolve()));
//         });
//         openPorts.delete(path);
//         return { ok: true };
//     } catch (err: any) {
//         return { ok: false, error: err?.message ?? String(err) };
//     }
// };

// export const closeAllPorts = async () => {
//     try {
//         await Promise.all(
//             Array.from(openPorts.values()).map(
//                 ({ port }) =>
//                     new Promise<void>((resolve, reject) => {
//                         port.close((err) => (err ? reject(err) : resolve()));
//                     })
//             )
//         );
//         openPorts.clear();
//         return { ok: true };
//     } catch (err: any) {
//         return { ok: false, error: err?.message ?? String(err) };
//     }
// };

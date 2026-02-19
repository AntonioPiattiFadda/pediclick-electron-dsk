
import { DeliveryOrderPayload, PrintPayload, PrintTicketPayload } from "@/types/printer";
import usb from "usb";
import { buildPrinterSelectedBuffer, printDeliveryOrder, printTicket } from "./printerBufferFactory";

export const bufferFunctions = {
    printTest: (printContent: PrintPayload) => buildPrinterSelectedBuffer(printContent as PrintTicketPayload),
    printTicket: (printContent: PrintPayload) => printTicket(printContent as PrintTicketPayload),
    printDeliveryOrder: (printContent: PrintPayload) => printDeliveryOrder(printContent as DeliveryOrderPayload),
}

export const print = (
    vendorId: number,
    productId: number,
    printFunction: keyof typeof bufferFunctions,
    printContent?: PrintPayload
) => {


    const device = usb.findByIds(vendorId, productId);


    if (!device) {
        console.error("USB printer not found");
        return;
    }

    try {
        device.open();
    } catch (err) {
        console.error("Failed to open USB device:", err);
        return;
    }

    if (!device.interfaces) {
        console.error("Failed to open USB device:", "No interfaces found");
        device.close();
        return
    }

    // 🔍 Buscar interfaz válida
    const iface = device.interfaces.find((iface) =>
        iface.endpoints.some((e) => e.direction === "out")
    );

    if (!iface) {
        console.error("No USB interface with OUT endpoint found");
        device.close();
        return;
    }

    // 🔓 Detach kernel driver si existe
    try {
        if (iface.isKernelDriverActive?.()) {
            iface.detachKernelDriver();
        }
    } catch (err) {
        console.warn("Could not detach kernel driver:", err);
        console.log("Continuing without detaching kernel driver.", err);
    }

    try {
        iface.claim();
    } catch (err) {
        console.log("Failed to claim interface:", err);
        console.error("Failed to claim interface:", err);
        device.close();
        return;
    }

    // 📤 Endpoint OUT
    const endpoint = iface.endpoints.find(
        (e) => e.direction === "out"
    ) as usb.OutEndpoint | undefined;

    if (!endpoint) {
        console.error("USB OUT endpoint not found");
        iface.release(true, () => device.close());
        return;
    }

    console.log("Preparing data to print...");

    let buffer;
    try {
        if (!printContent && printFunction !== "printTest") {
            throw new Error("Print content is required");
        }
        buffer = bufferFunctions[printFunction](printContent as PrintPayload);
    } catch (error) {
        console.error("Error building print buffer:", error);
        iface.release(true, () => {
            device.close();
        });
        return;
    }


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    endpoint.transfer(buffer, (err: any) => {
        if (err) {
            console.error("Transfer error:", err);
        }

        iface.release(true, () => {
            device.close();
        });
    });
};



export const checkPrinterConnection = (
    vendorId: number,
    productId: number
): { success: boolean; error?: string } => {
    const device = usb.findByIds(vendorId, productId);

    if (!device) {
        return { success: false, error: "USB printer not found" };
    }

    try {
        device.open();
    } catch (err) {
        return { success: false, error: `Failed to open USB device: ${err}` };
    }

    if (!device.interfaces) {
        device.close();
        return { success: false, error: "No interfaces found" };
    }

    const iface = device.interfaces.find((iface) =>
        iface.endpoints.some((e) => e.direction === "out")
    );

    if (!iface) {
        device.close();
        return { success: false, error: "No USB interface with OUT endpoint found" };
    }

    try {
        if (iface.isKernelDriverActive?.()) {
            iface.detachKernelDriver();
        }
    } catch {
        // Continue without detaching
    }

    try {
        iface.claim();
    } catch (err) {
        device.close();
        return { success: false, error: `Failed to claim interface: ${err}` };
    }

    iface.release(true, () => {
        device.close();
    });

    return { success: true };
};

//No asignados los siguientes al main ni al preload ni al renderer

// export const printTicket = (ticket: string) => {
//     // 1️⃣ Create a temporary text file
//     const tempDir = os.tmpdir();
//     const filePath = path.join(tempDir, "ticket.txt");

//     fs.writeFileSync(filePath, ticket, "utf8");

//     // 2️⃣ Execute CMD print command
//     exec(`cmd /c print "${filePath}"`, (error) => {
//         if (error) {
//             console.error("Print error:", error);
//         }
//     });
// };

// export const printBarcode = (barcode: string) => {
//     // 1️⃣ Create a temporary text file
//     const tempDir = os.tmpdir();
//     const filePath = path.join(tempDir, "barcode.txt");
//     fs.writeFileSync(filePath, barcode, "utf8");
//     // 2️⃣ Execute CMD print command
//     exec(`cmd /c print "${filePath}"`, (error) => {
//         if (error) {
//             console.error("Print error:", error);
//         }
//     }
//     );
// }

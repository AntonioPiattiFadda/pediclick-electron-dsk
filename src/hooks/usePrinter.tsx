import { PrintTicketPayload } from "@/types/printer";

const usePrinter = () => {

    const VENDOR_ID = 1659;
    const PRODUCT_ID = 8965;

    const handlePrintTest = () => {
        try {
            window.printer.print(VENDOR_ID, PRODUCT_ID, "printTest");
        } catch (error) {
            console.error("Error al imprimir:", error);
        }
    };

    const handlePrintTicket = (printContent: PrintTicketPayload) => {
        try {
            window.printer.print(VENDOR_ID, PRODUCT_ID, "printTicket", printContent);
        } catch (error) {
            console.error("Error al imprimir:", error);
        }
    };

    return { handlePrintTest, handlePrintTicket };

};

export default usePrinter;
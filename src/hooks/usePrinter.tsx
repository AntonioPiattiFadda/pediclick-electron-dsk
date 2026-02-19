import { RootState } from "@/stores/store";
import { DeliveryOrderPayload, PrintTicketPayload } from "@/types/printer";
import { useSelector } from "react-redux";
import { useGetLocationData } from "./useGetLocationData";
import { getPrinterConfig } from "./usePrinterConfig";

const usePrinter = () => {
    const { handleGetLocation } = useGetLocationData();
    const userData = useSelector((state: RootState) => state.user);
    const location = handleGetLocation();

    const config = getPrinterConfig();
    const VENDOR_ID = config?.vendorId ?? 0;
    const PRODUCT_ID = config?.productId ?? 0;

    const handlePrintTest = () => {
        try {
            window.printer.print(VENDOR_ID, PRODUCT_ID, "printTest");
        } catch (error) {
            console.error("Error al imprimir:", error);
        }
    };

    const handlePrintTicket = (printContent: {
        order: PrintTicketPayload["order"];
        orderItems: PrintTicketPayload["orderItems"];
    }) => {
        try {
            const completedPrintContent = {
                ...printContent,
                user: userData,
                location: location,
            };
            window.printer.print(VENDOR_ID, PRODUCT_ID, "printTicket", completedPrintContent);
        } catch (error) {
            console.error("Error al imprimir:", error);
        }
    };

    const handlePrintDeliveryOrder = (printContent: {
        order: DeliveryOrderPayload["order"];
        orderItems: DeliveryOrderPayload["orderItems"];
        client: DeliveryOrderPayload["client"];
    }) => {
        const completedPrintContent = {
            ...printContent,
            user: userData,
            location: location,
        };
        console.log("Contenido completo para impresión:", completedPrintContent);
        try {
            window.printer.print(VENDOR_ID, PRODUCT_ID, "printDeliveryOrder", completedPrintContent);
        } catch (error) {
            console.error("Error al imprimir orden de delivery:", error);
        }
    };

    return { handlePrintTest, handlePrintTicket, handlePrintDeliveryOrder };

};

export default usePrinter;
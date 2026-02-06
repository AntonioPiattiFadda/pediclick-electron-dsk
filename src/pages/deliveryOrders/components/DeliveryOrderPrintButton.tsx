import { Button } from "@/components/ui/button";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import usePrinter from "@/hooks/usePrinter";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/service";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";
import { Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DeliveryOrderPrintButtonProps {
  order: OrderT;
  onClick?: (e: React.MouseEvent) => void;
}

export function DeliveryOrderPrintButton({
  order,
  onClick,
}: DeliveryOrderPrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { handlePrintTicket } = usePrinter();
  const { userData } = useUserData();
  const { location } = useGetLocationData();

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);

    if (isPrinting) return;

    try {
      setIsPrinting(true);

      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.order_id)
        .eq("is_deleted", false);

      if (itemsError) {
        throw new Error("Error al cargar items de la orden");
      }

      if (!orderItems || orderItems.length === 0) {
        toast.warning("La orden no tiene items para imprimir");
        return;
      }

      if (!location) {
        throw new Error("No se pudo obtener la información de la ubicación");
      }

      // Print ticket
      handlePrintTicket({
        user: userData,
        location: location,
        order: order,
        orderItems: orderItems as OrderItem[],
      });

      toast.success("Ticket impreso correctamente");
    } catch (error) {
      console.error("Error al imprimir ticket:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al imprimir ticket"
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handlePrint}
      disabled={isPrinting}
      className="h-8 w-8"
      title="Imprimir ticket"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
}

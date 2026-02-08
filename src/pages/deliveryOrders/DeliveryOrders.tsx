import { useGetLocationData } from "@/hooks/useGetLocationData";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";
import { startEmptyDeliveryOrder, supabase } from "@/service";
import { OrderT } from "@/types/orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import DeliveryOrder from "./DeliveryOrder";
import { DeliveryOrderSelector } from "./components/DeliveryOrderSelector";
import { useDeliveryOrderContext } from "@/context/DeliveryOrderContext";

export function DeliveryOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderId = searchParams.get("orderId")
    ? Number(searchParams.get("orderId"))
    : null;

  const { handleGetLocationId } = useGetLocationData();
  const { handleGetTerminalSessionId } = useTerminalSessionData();
  const queryClient = useQueryClient();
  const { setActiveDeliveryOrderId } = useDeliveryOrderContext();

  // Update active delivery order ID in context when URL changes
  useEffect(() => {
    setActiveDeliveryOrderId(selectedOrderId);
  }, [selectedOrderId, setActiveDeliveryOrderId]);

  // Fetch selected order from database
  const {
    data: selectedOrder,
    isLoading: isLoadingOrder,
    error: orderError,
  } = useQuery({
    queryKey: ["delivery-order", selectedOrderId],
    queryFn: async () => {

      const { data, error } = await supabase
        .from("orders")
        .select("*, client:clients(*)")
        .eq("order_id", selectedOrderId)
        .single();

      if (error) throw error;
      return data as OrderT;
    },
    enabled: !!selectedOrderId,
    refetchOnWindowFocus: false,
  });

  // Real-time subscription for order_items of selected order
  useEffect(() => {
    if (!selectedOrderId) return;

    const channel = supabase
      .channel(`order-items-${selectedOrderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `order_id=eq.${selectedOrderId}`,
        },
        (payload) => {
          // alert("Cambios detectados en los items de la orden. Refrescando datos...");
          console.log("Order item change detected:", payload);
          queryClient.invalidateQueries({
            queryKey: ["delivery-order", selectedOrderId],
          });
          queryClient.invalidateQueries({ queryKey: ["order-items"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrderId, queryClient]);

  // Real-time subscription for selected order changes
  useEffect(() => {
    if (!selectedOrderId) return;

    const channel = supabase
      .channel(`order-${selectedOrderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_id=eq.${selectedOrderId}`,
        },
        (payload) => {
          console.log("Order change detected:", payload);
          queryClient.invalidateQueries({
            queryKey: ["delivery-order", selectedOrderId],
          });
          toast.info("Orden actualizada por otro usuario");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrderId, queryClient]);

  // Create new delivery order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const terminalSessionId = await handleGetTerminalSessionId();
      return await startEmptyDeliveryOrder(
        handleGetLocationId(),
        terminalSessionId
      );
    },
    onSuccess: (data) => {
      if (import.meta.env.DEV) console.log("Orden de delivery creada:", data);
      setSearchParams({ orderId: data.order_id.toString() });
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      toast.success("Orden creada exitosamente");
    },
    onError: (e) => {
      console.error("Error creando orden de delivery", e);
      toast.error("Error al crear orden");
    },
  });

  const handleOrderSelect = (orderId: number | null) => {
    if (orderId) {
      setSearchParams({ orderId: orderId.toString() });
    } else {
      setSearchParams({});
    }
  };

  const handleCreateOrder = () => {
    if (createOrderMutation.isPending) return;
    createOrderMutation.mutate();
  };

  const handleChangeOrder = (updatedOrder: OrderT) => {
    // Invalidate queries to refetch from DB
    queryClient.invalidateQueries({
      queryKey: ["delivery-order", updatedOrder.order_id],
    });
    queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
  };

  // Show error if order fetch failed
  useEffect(() => {
    if (orderError) {
      toast.error("Error al cargar la orden");
      setSearchParams({});
    }
  }, [orderError, setSearchParams]);

  return (
    <div className="w-full">
      <div className="w-full flex justify-between items-center px-4 py-3">
        <h1 className="text-2xl">Órdenes de Delivery</h1>

        <DeliveryOrderSelector
          isCreatingOrder={createOrderMutation.isPending}
          selectedOrderId={selectedOrderId}
          onOrderSelect={handleOrderSelect}
          onCreateOrder={handleCreateOrder}
        />
      </div>


      {/* Order Content Area */}
      {!selectedOrderId && (
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          <div className="text-center space-y-2">
            <p>Seleccione una orden del menú superior o cree una nueva.</p>
          </div>
        </div>
      )}

      {selectedOrderId && isLoadingOrder && (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Cargando orden...</p>
        </div>
      )}

      {selectedOrderId && selectedOrder && (
        <DeliveryOrder
          order={selectedOrder}
          onChangeOrder={(updatedOrder: OrderT) => {
            handleChangeOrder(updatedOrder);
          }}
        />
      )}
    </div>
  );
}

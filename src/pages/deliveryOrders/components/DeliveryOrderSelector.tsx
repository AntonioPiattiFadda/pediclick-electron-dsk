import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { getDeliveryOrdersByDateRange, OrderWithMetadata, supabase } from "@/service";
import { formatDateToHours } from "@/utils";
import { formatCurrency } from "@/utils/prices";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { DATE_RANGE_OPTIONS } from "../constants";
import { DeliveryOrderPrintButton } from "./DeliveryOrderPrintButton";

type DateRangeFilter = "today" | "2days" | "3days" | "5days" | "7days";

interface DeliveryOrderSelectorProps {
  selectedOrderId: number | null;
  onOrderSelect: (orderId: number | null) => void;
  onCreateOrder: () => void;
  isCreatingOrder: boolean;
}

const FILTER_STORAGE_KEY = "delivery-order-filters";

export function DeliveryOrderSelector({
  selectedOrderId,
  onOrderSelect,
  onCreateOrder,
  isCreatingOrder
}: DeliveryOrderSelectorProps) {
  const { handleGetLocationId } = useGetLocationData();
  const locationId = handleGetLocationId();
  const queryClient = useQueryClient();

  // Load filters from localStorage
  const loadFilters = () => {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored filters:", e);
      }
    }
    return { dateRange: "today" as DateRangeFilter };
  };

  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(
    loadFilters().dateRange
  );

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({ dateRange: dateRangeFilter })
    );
  }, [dateRangeFilter]);

  const daysBack =
    DATE_RANGE_OPTIONS.find((opt) => opt.value === dateRangeFilter)?.days || 0;

  // Fetch delivery orders
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["delivery-orders", locationId, daysBack],
    queryFn: () => getDeliveryOrdersByDateRange(locationId, daysBack),
    enabled: !!locationId,
    refetchOnWindowFocus: false,
  });

  // Real-time subscription for orders table
  useEffect(() => {
    if (!locationId) return;

    const channel = supabase
      .channel("delivery-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `order_type=eq.DELIVERY,location_id=eq.${locationId}`,
        },
        (payload) => {
          console.log("Order change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, queryClient]);



  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "NO PAGADO",
      PAID: "PAGADO",
      // PARTIALLY_PAID: "PAGO PARCIAL",
      // REFUNDED: "REEMBOLSADO",
      // PARTIALLY_REFUNDED: "REEMBOLSO PARCIAL",
      // NEW: "NUEVA",
    };
    return labels[status] || status;
  };

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "PENDIENTE",
      PREPARING: "EN PREPARACIÓN",
      READY: "LISTO",
      DELIVERING: "EN REPARTO",
      DELIVERED: "ENTREGADO",
      CANCELLED: "CANCELADO",
    };
    return labels[status] || status;
  }

  return (
    <div className="flex gap-2  items-center ">
      {/* Filters Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Período:</span>
          <Select
            value={dateRangeFilter}
            onValueChange={(value: DateRangeFilter) =>
              setDateRangeFilter(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Dropdown Row */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedOrderId?.toString() || ""}
          onValueChange={(value) => onOrderSelect(value ? Number(value) : null)}
        >
          <SelectTrigger className="flex-1 min-w-[250px]">
            <SelectValue placeholder="Seleccionar orden..." />
          </SelectTrigger>
          <SelectContent>
            {isLoading && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Cargando órdenes...
              </div>
            )}
            {error && (
              <div className="px-2 py-4 text-sm text-destructive text-center">
                Error al cargar órdenes
              </div>
            )}
            {!isLoading && !error && orders.length === 0 && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No hay órdenes para el período seleccionado
              </div>
            )}
            {orders.map((order: OrderWithMetadata) => (
              <SelectItem
                key={order.order_id}
                value={order.order_id.toString()}
                className="flex items-center justify-between"
              >
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="text-sm font-mono">
                    #{order.order_number} | {order.client_full_name || "Sin cliente"}{" "}
                    | {order.item_count} items |{" "}
                    {getPaymentStatusLabel(order.payment_status)} |{" "}
                    {formatCurrency(order.total_amount)} |{" "}
                    {formatDateToHours(order.created_at)} |{" "}
                    {getOrderStatusLabel(order.order_status)}
                  </span>

                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedOrderId && (
          <DeliveryOrderPrintButton
            order={orders.find((o) => o.order_id === selectedOrderId) || {} as OrderWithMetadata}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        )}

        <Button disabled={isCreatingOrder} onClick={onCreateOrder} size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {isCreatingOrder ? "Creando..." : "Nuevo pedido"}
        </Button>
      </div>
    </div>
  );
}

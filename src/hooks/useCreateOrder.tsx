import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "../service/orders";

// Tipos
interface OrderItem {
  product_id: number;
  lot_id?: number;
  quantity: number;
  unit_price: number;
}

interface CreateOrderPayload {
  business_owner_id?: number;
  provider_id: number | null;
  notes?: string;
  order_items: OrderItem[];
}

interface CreateOrderResponse {
  success: boolean;
  order_id: number;
}

// Hook
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<CreateOrderResponse, Error, CreateOrderPayload>({
    mutationFn: async (payload: CreateOrderPayload) => {
      const res = await createOrder(payload, "OWNER");
      return res.data;
    },
    onSuccess: (data) => {
      if (import.meta.env.DEV) console.log("Orden creada:", data.order_id);

      // ⚡ Opcional: invalidar queries relacionadas (lista de órdenes, balances, etc.)
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

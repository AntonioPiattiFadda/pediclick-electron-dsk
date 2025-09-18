import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

type ServiceOrderItem = {
  product_id: number;
  lot_id?: number;
  quantity: number;
  unit_price: number;
};

export interface CreateOrderPayload {
  provider_id: number | null;
  notes?: string;
  order_items: ServiceOrderItem[];
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: number;
}

export const createOrder = async (payload: CreateOrderPayload, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);


  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      business_owner_id: businessOwnerId,
      ...payload,
    })
    .select()
    .single();


  if (orderError) {
    console.error("orderError", orderError);
    throw new Error("Error al crear la orden");
  }

  return {
    data: {
      success: true,
      order_id: newOrder?.order_id as number,
    },
  };
};

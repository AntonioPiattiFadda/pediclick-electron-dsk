import { supabase } from ".";
import { OrderItem } from "@/types/orderItems";
/**
 * Add item to delivery order
 * Later: Convert to RPC call with inventory validation
 */
export async function addDeliveryOrderItem(
  orderId: number,
  itemData: OrderItem
): Promise<OrderItem> {
  const { data, error } = await supabase.rpc("register_order_items", {
    p_order_id: orderId,
    p_items: [
      {
        ...itemData
      }
    ]
  })

  if (error) throw error;
  return data as OrderItem;
}

/**
 * Update order item
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderItem(
  orderItemId: number,
  updates: Partial<OrderItem>
): Promise<OrderItem> {
  const { data, error } = await supabase
    .from("order_items")
    .update(updates)
    .eq("order_item_id", orderItemId)
    .select()
    .single();

  if (error) throw error;
  return data as OrderItem;
}

/**
 * Remove item from delivery order (soft delete via status update)
 * Later: Convert to RPC call
 */
export async function removeDeliveryOrderItem(
  orderItemId: number,
  stockId: number,
): Promise<void> {
  const { error } = await supabase.rpc("delete_delivery_order_item", {
    p_order_item_id: orderItemId,
    p_stock_id: stockId,
  });

  if (error) throw error;
}


export const getDeliveryOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  const { data, error } = await supabase
    .from("order_items")
    .select(`
      order_item_id,
      order_id,
      product_id,
      product_presentation_id,
      lot_id,
      stock_id,
      location_id,
      quantity,
      over_sell_quantity,
      price,
      price_type,
      logic_type,
      subtotal,
      discount,
      tax,
      total,
      status,
      created_at,
      is_deleted,
      products(product_name),
      product_presentations(product_presentation_name)
    `)
    .eq("order_id", orderId);

  if (error) throw error;
  if (!data) return [];

  const formattedData = data.map((item) => {
    const { products, product_presentations, ...orderItemFields } = item;

    return {
      ...orderItemFields,
      product_name: products?.product_name || "Producto desconocido",
      product_presentation_name: product_presentations?.product_presentation_name || "Presentación desconocida",
    } as OrderItem;
  });


  return formattedData;
}
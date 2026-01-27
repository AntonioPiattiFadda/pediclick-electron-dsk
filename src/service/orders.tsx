import { NotificationsType } from "@/types/notifications";
import { OrderItem } from "@/types/orderItems";
import { Payment } from "@/types/payments";
import { OrderT } from "@/types/orders";
import { getUserId, supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export async function createOrder(order: OrderT, orderItems: OrderItem[], payments: Partial<Payment>[]) {

  const businessOwnerId = await getBusinessOwnerId();
  console.log("Creating order with:", { order, orderItems, payments });

  const adaptedOrderItems: Omit<OrderItem, 'product_name' | 'product_presentation_name'>[] = orderItems.map((it) => ({
    order_id: it.order_id,
    product_id: it.product_id,
    price: it.price,
    quantity: it.quantity,
    over_sell_quantity: it.over_sell_quantity,
    subtotal: it.subtotal,
    discount: it.discount,
    tax: it.tax,
    total: it.total,
    product_presentation_id: it.product_presentation_id,
    lot_id: it.lot_id,
    stock_id: it.stock_id,
    price_type: it.price_type,
    logic_type: it.logic_type,
    created_at: it.created_at,
    status: it.status,
    location_id: it.location_id,
  }));

  console.log("Adapted order items:", adaptedOrderItems);

  const subtotalSum = orderItems.reduce((s, it) => s + (it.subtotal || 0), 0);
  const discountSum = orderItems.reduce((s, it) => s + (it.discount || 0), 0);
  const taxSum = orderItems.reduce((s, it) => s + (it.tax || 0), 0);
  const totalSum = orderItems.reduce((s, it) => s + (it.total || 0), 0);

  //FIXME no se esta calculando bien el total_price, el sold quantity para restar el stock. El stock sold no tiene productId ni store id,
  //FIXME La client transaction tampoco se esta actualizando bien
  const adaptedOrder: OrderT = {
    ...order,
    business_owner_id: businessOwnerId,
    payment_status: payments.length === 0 ? "PENDING" : "PAID",
    order_status: order.order_status,
    subtotal: subtotalSum,
    discount: discountSum,
    tax: taxSum,
    total_amount: totalSum,

  };

  console.log("Adapted order:", adaptedOrder);

  const filteredpayments = payments.filter((it) => it.amount && it.amount > 0).map((it) => ({
    ...it,
    payment_direction: "IN",
    payment_type: "ORDER",
  }));



  const { data, error } = await supabase.rpc("register_order", {
    p_order: adaptedOrder,
    p_order_items: adaptedOrderItems,
    p_order_payments: filteredpayments,
  });
  console.log("data, error:", data, error);


  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function cancelOrder(order: OrderT, orderItems: OrderItem[]) {

  const businessOwnerId = await getBusinessOwnerId();

  const userId = await getUserId();

  const notification: NotificationsType = {
    business_owner_id: businessOwnerId,
    title: "Orden cancelada",
    message: `La orden ${order.order_number} ha sido cancelada.`,
    status: 'PENDING',
    order_id: order.order_id,
    location_id: order.location_id,
    canceled_by: userId || '',
  };

  const { error: notificationsError } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  if (notificationsError) throw notificationsError;

  console.log("Cancelling order with:", { order, orderItems, notification });

  const adaptedOrder = { ...order, business_owner_id: businessOwnerId, order_status: "CANCELLED" };
  delete adaptedOrder.client;

  const { error: orderError } = await supabase
    .from("orders")
    .update(adaptedOrder)
    .eq("order_id", order.order_id)
    .select()
    .single();

  if (orderError) throw orderError;

  const adaptedOrderItems: Omit<OrderItem, 'product_name' | 'product_presentation_name'>[] = orderItems.map((it) => ({
    order_id: it.order_id,
    product_id: it.product_id,
    price: it.price,
    quantity: it.quantity,
    over_sell_quantity: it.over_sell_quantity,
    subtotal: it.subtotal,
    discount: it.discount,
    tax: it.tax,
    total: it.total,
    product_presentation_id: it.product_presentation_id,
    stock_id: it.stock_id,
    price_type: it.price_type,
    logic_type: it.logic_type,
    created_at: it.created_at,
    status: it.status,
    location_id: it.location_id,
    lot_id: it.lot_id,
  }));

  console.log("Adapted order items:", adaptedOrderItems);
  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(adaptedOrderItems) // 👈 ARRAY → insert múltiple
    .select();

  if (orderItemsError) throw orderItemsError;

  //FIXME no se esta calculando bien el total_price, el sold quantity para restar el stock. El stock sold no tiene productId ni store id,
  //FIXME La client transaction tampoco se esta actualizando bien

  // const { data, error } = await supabase
  //   .rpc("cancel_order", {
  //     p_order: adaptedOrder,
  //     p_order_items: adaptedOrderItems,
  //     p_notification: notification,
  //   });

  // console.log("data, error:", data, error);

  // if (error) {
  //   throw error;
  // }

  // console.log("Orden creada con ID:", data);
  // return data;

  return order.order_id;
}

export async function generateOrderNumber(locationId: number) {
  // 1) Buscar secuencia existente
  const { data: seq, error: fetchError } = await supabase
    .from("store_order_sequences")
    .select("*")
    .eq("location_id", locationId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // Si el error NO es "no rows", lo tiramos
    throw fetchError;
  }

  let nextNumber = 1;
  // 2) Si existe → incrementamos en JS
  if (seq) {
    nextNumber = seq.last_number + 1;
    // 3) Upsert con el valor nuevo
    const { error: upsertError } = await supabase
      .from("store_order_sequences")
      .update({
        location_id: locationId,
        last_number: nextNumber,
      })
      .eq("location_id", locationId)
      .select()
      .single();

    if (upsertError) throw upsertError;
  } else {// 3) Si no existe → insert con valor 1
    const { error: insertError } = await supabase
      .from("store_order_sequences")
      .insert({
        location_id: locationId,
        last_number: nextNumber,
      });
    if (insertError) throw insertError;


  }
  // 4) Devolver número correlativo
  return nextNumber;
}

export async function startEmptyOrder(locationId: number) {
  const businessOwnerId = await getBusinessOwnerId();

  const response = await generateOrderNumber(locationId);

  const orderNumber = response

  const { data: newOrder, error: error } = await supabase
    .from("orders")
    .insert({
      location_id: locationId,
      business_owner_id: businessOwnerId,
      order_number: orderNumber,
      payment_status: "PENDING",
      order_type: "DIRECT_SALE",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creando la orden:", error);
    throw error;
  }

  return newOrder;
}

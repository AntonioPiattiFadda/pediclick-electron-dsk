export type ClientType = "FINAL" | "REGISTERED"
export type OrderType = "DIRECT_SALE" | "CREDIT_ORDER" | "RESERVATION" | "ONLINE_PICKUP"
export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "ON_HOLD" | "DELIVERED" | "PARTIALLY_PAID" | "REFUNDED" | "PARTIALLY_REFUNDED"

export interface Order {
  order_id?: number;
  business_owner_id?: number;
  store_id: number;
  client_type: ClientType;
  client_id?: number | null;
  provider_id?: number;
  order_number: string;
  order_type: OrderType;

  // 🔥 eliminamos payment_method y final_payment_method
  // en su lugar, tendremos OrderPayment[] asociado a la orden
  payment_status: PaymentStatus;

  subtotal: number;
  discount?: number;
  tax?: number;
  total_amount: number;
  currency: string;
  notes?: string;
  delivery_date?: string; // ISO date string
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

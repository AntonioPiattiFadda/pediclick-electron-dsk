export interface Order {
  order_id?: number;
  business_owner_id?: number;
  store_id: number;
  client_id?: number;
  provider_id?: number;
  order_number: string;
  order_type: string;
  payment_method: string;
  payment_status: string;
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

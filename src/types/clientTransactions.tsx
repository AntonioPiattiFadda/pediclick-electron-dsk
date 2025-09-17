// =======================
// Client Transactions
// =======================
export interface ClientTransaction {
  transaction_id: string;
  client_id: string;
  order_id?: string;
  transaction_type: string;
  amount: number;
  description?: string;
  created_at: string;
}

import { PaymentMethod } from "./orderPayments";
// =======================
// Client Transactions
// =======================
export type TransactionType = "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE" | "ADJUSTMENT";

export interface ClientTransaction {
  transaction_id: string;
  client_id: string;
  order_id?: string;
  amount: number;
  description?: string;
  created_at: string;


  transaction_type: TransactionType;
  transaction_date: string;
  payment_method?: PaymentMethod;
  payment_status: "PENDING" | "COMPLETED" | "FAILED";
  balance_after_transaction: number;
}

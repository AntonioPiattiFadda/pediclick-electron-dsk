export type PaymentMethod =
    | "CASH"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "BANK_TRANSFER"
    | "MOBILE_PAYMENT"
    | "ON_CREDIT"
    | "CRYPTO";

export type FinalPaymentMethod =
    | "CASH"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "BANK_TRANSFER"
    | "MOBILE_PAYMENT"
    | "CRYPTO";


export interface OrderPayment {
    order_payment_id?: number;
    order_id: number; // referencia a la orden
    method: PaymentMethod;
    final_payment_method?: FinalPaymentMethod; // solo si es el pago final
    amount: number;
    created_at: string;
}
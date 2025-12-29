export type PaymentMethod =
    | "CASH"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "BANK_TRANSFER"
    | "MOBILE_PAYMENT"
    | "CHECK"
    | "ON_CREDIT"
    | "CRYPTO"
    | "OVERPAYMENT";


export type FinalPaymentMethod =
    | "CASH"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "BANK_TRANSFER"
    | "CRYPTO";


export interface OrderPayment {
    order_payment_id?: number;
    order_id: number; // referencia a la orden
    payment_method: PaymentMethod;
    final_payment_method?: FinalPaymentMethod; // solo si es el pago final
    amount: number;
    created_at?: string;

    selected: boolean; // para UI
}
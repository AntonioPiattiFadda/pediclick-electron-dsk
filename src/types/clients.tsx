export type TaxConditionType =
  | "VAT_REGISTERED_RESPONSIBLE"
  | "VAT_EXEMPT_SUBJECT"
  | "FINAL_CONSUMER"
  | "MONOTAX_RESPONSIBLE"
  | "UNCATEGORIZED_SUBJECT"
  | "FOREIGN_SUPPLIER"
  | "FOREIGN_CLIENT"
  | "VAT_LIBERATED_LAW_19640"
  | "SOCIAL_MONOTAX"
  | "VAT_NOT_REACHED"
  | "PROMOTED_INDEPENDENT_MONOTAX_WORKER";


export interface Client {
  client_id: number;
  organization_id: string;
  full_name: string;
  email: string;
  phone?: string;
  document_number?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  tax_ident?: string;
  credit_limit?: number;
  current_balance: number;

  is_active: boolean;
  created_at: string; // ISO date string
  updated_at?: string;
  deleted_at?: string;

  last_transaction_date?: string; // ISO date string

  tax_condition: TaxConditionType;
  billing_enabled: boolean;
  available_credit: number;

  short_code: number;

}






export interface Client {
  client_id: string;
  business_owner_id: string;
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
}

import type { Address } from "./shared";

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  address: Address | null;
  is_verified: boolean;
  parent_user_id: string;
  store_id: number;
  job_position: string | null;
  
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
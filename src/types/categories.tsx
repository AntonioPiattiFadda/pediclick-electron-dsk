 export interface Category {
      category_id: string;
      category_name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  business_owner_id: string | null;
}
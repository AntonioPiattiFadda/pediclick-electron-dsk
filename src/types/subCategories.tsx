export interface SubCategory {
  sub_category_id: string;
  sub_category_name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  organization_id: string | null;
}
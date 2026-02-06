import type { Address } from "./shared";





export type SocialLinks = string;
// {
//   facebook?: string;
//   instagram?: string;
//   tiktok?: string;
//   linkedin?: string;
//   [key: string]: string | undefined;
// }

export type OpeningHours = string;
// {
//   [day: string]: { from: string; to: string }[];
// }

export interface Store {
  store_id: number;
  store_name: string;
  description: string;
  address: Address;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  social_links: SocialLinks;
  opening_hours: OpeningHours;
  updated_at?: string;
  deleted_at: string | null;
  organization_id: string;
  slug: string;
}
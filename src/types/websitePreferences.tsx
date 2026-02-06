  export interface HomepageLayoutSection {
      type: string;
      order: number;
      [key: string]: unknown;
    }

export interface WebsitePreference {
  id: string;
  theme?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  favicon_url?: string;
  homepage_layout?: HomepageLayoutSection[];
  custom_css?: string;
  language?: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

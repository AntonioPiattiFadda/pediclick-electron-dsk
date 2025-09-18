export type PriceLogicType = "QUANTITY_DISCOUNT" | "SPECIAL" | "LIMITED_OFFER";

export type Price = {
  price_id?: number;
  lot_id: number;
  price_number: number;

  unit_price: number;
  units_per_price: number;
  profit_percentage: number;

  price_type: "MINOR" | "MAYOR";
  logic_type: PriceLogicType;
  observations: string | null;

  is_limited_offer: boolean;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at?: string;
  updated_at?: string | null;
};

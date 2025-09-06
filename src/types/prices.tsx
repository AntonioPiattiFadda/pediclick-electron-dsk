export type PriceLogicType = "QUANTITY_DISCOUNT" | "SPECIAL";

export type Price = {
  price_id?: number;
  lot_id: number;
  price_number: string;
  price_quantity: string;
  price_type: "MINOR" | "MAYOR";
  quantity_discount: number;
  logic_type: PriceLogicType;

  is_limited_offer: boolean;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at?: string;
  updated_at?: string | null;
};

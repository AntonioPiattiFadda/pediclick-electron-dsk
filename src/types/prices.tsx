export type PriceLogicType = "QUANTITY_DISCOUNT" | "SPECIAL" | "LIMITED_OFFER";

export type DisabledPrice = {
  id?: number;
  price_id: number;
  location_id: number;
  created_at?: string;
};

export type EnabledPriceClient = {
  id?: number;
  price_id: number;
  client_id: number;
  created_at?: string;
};

export type Price = {
  price_id?: number;
  location_id: number | null;
  price_number: number;
  product_presentation_id: number;

  price: number;
  qty_per_price: number;
  profit_percentage: number;

  logic_type: PriceLogicType;
  observations: string | null;

  valid_from: string | null;
  valid_until: string | null;
  created_at?: string;
  updated_at?: string | null;

  enabled_prices_clients?: { client_id: number }[]; // Only for SPECIAL prices; empty = all clients
  disabled_prices?: { location_id: number }[];       // Universal prices only; row = suppressed at that location
};

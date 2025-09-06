export type Stock = {
  stock_id?: number;
  location_id: number;
  current_quantity: number;
  lot_id: number;
  min_notification: number;
  max_notification: number;
  stock_type:
    | "STORE"
    | "WASTE"
    | "NOT ASSIGNED"
    | "SOLD"
    | "TRANSFORMED"
    | "STOCKROOM";

  transformed_from_product_id: number | null;
  transformed_to_product_id: number | null;

  last_updated: string | null;
};

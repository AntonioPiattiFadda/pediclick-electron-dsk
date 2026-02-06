import type { LotContainersStock } from "./lotContainersStock";

type StockType =
  | "STORE"
  | "WASTE"
  | "NOT_ASSIGNED"
  | "SOLD"
  | "TRANSFORMED"
  | "STOCKROOM"

export type Stock = {
  stock_id?: number | null;
  product_id?: number;

  // store_id: number | null;
  // stock_room_id: number | null;

  location_id: number | null;

  quantity: number;
  lot_id: number | null;
  min_notification: number | null;
  max_notification: number | null;

  is_new?: boolean;

  stock_type: StockType;

  lot_containers_location?: LotContainersStock[];

  reserved_for_transferring_quantity: number | null;
  reserved_for_selling_quantity: number | null;

  transformed_from_product_id: number | null;

  updated_at: string | null;


  // transformed_to_product_id: number | null;
  // reserved_to_transferring_quantity: number | null;
  // stock_movement_status: MovementStatus | null;
};

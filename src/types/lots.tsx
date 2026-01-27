import type { LotContainersStock } from "./lotContainersStock";
import type { Price } from "./prices";
import type { Stock } from "./stocks";

export type CommissionType = "TOTAL_PERCENTAGE" | "BY_UNIT" | "NONE";

// Asignación de vacíos por lote (soporta múltiples vacíos por lote)
export type LotContainerAssignment = {
  lot_container_id: number;
  quantity: number;
};

export type BaseLot = {
  lot_id: number;
  load_order_id: number | null;
  product_name?: string;
  product_id: number;
  product_presentation_id: number | null;
  lot_number: number | null;
  expiration_date: string | null;
  expiration_date_notification: boolean;
  is_expired: boolean;
  provider_id: number | null;
  has_lot_container: boolean;
  lot_containers: {
    lot_container_id: number | null;
    quantity: number | null;
  }[];
  is_parent_lot: boolean;
  parent_lot_id: number | null;
  lot_control: boolean;

  //Caracteristicas inmutables

  // // Tiene el mismo nombre que en producto para saber si tiene control de lotes
  // uses_lots: boolean;
  // //NEW
  // tracks_stock: boolean;
  // is_unassigned_stock: boolean;

  providers?: {
    provider_name: string;
  };

  stockData?: {
    stock?: Stock;
    lot_number: number;
    lot_id: number;
    totalQty: number | null;
    purchase_cost_per_unit: number | null;

  };

  stock?: Stock[];
  prices?: Price[];

  // El stock es por bulto entonces al hacer el calculo hay que restar la equivalencia?
  initial_stock_quantity: number;
  current_stock_quantity?: number;
  is_sold_out: boolean;

  download_total_cost: number | null;
  download_cost_per_unit: number | null;
  download_cost_per_bulk: number | null;

  purchase_cost_total: number | null;
  purchase_cost_per_unit: number | null;
  purchase_cost_per_bulk: number | null;


  final_cost_total: number | null;        // purchase_cost_total + extra_cost_total
  final_cost_per_unit: number | null;
  final_cost_per_bulk: number | null;
  //NOTE informacion de la compra. Si esta liquidado


  // bulk_quantity_equivalence: number | null;

  delivery_cost_total: number | null;
  delivery_cost_per_unit: number | null;
  delivery_cost_per_bulk: number | null;


  productor_commission_type: CommissionType; // Radio button
  productor_commission_percentage: number | null; // Input tipo numero, solo si productor_commission_type es BY_UNIT
  productor_commission_unit_value: number | null; // Input tipo numero, solo si productor_commission_type es FIXED

  purchasing_agent_id: number | null; // Selector de comprador
  purchasing_agent_commision_type: CommissionType; // Radio button
  purchasing_agent_commision_percentage: number | null; // Input tipo numero, solo si purchasing_agent_type es TOTAL_PERCENTAGE
  purchasing_agent_commision_unit_value: number | null; // Input tipo numero, solo si buyer_commission_type es FIXED


  created_at: string;
  deleted_at?: string;

  is_derived: boolean;
  is_transformed: boolean;
  quantity_transformed: number | null;


  lot_containers_location?: LotContainersStock[];
};

export type LotWithControl = BaseLot & {
  lot_control: true;
};

export type LotWithoutControl = BaseLot & {
  lot_control: false;
};

export type Lot = LotWithControl | LotWithoutControl;

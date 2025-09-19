//Crear tabla intermedia entre producto y lote

import type { Price } from "./prices";
import type { Stock } from "./stocks";

export type BaseLot = {
  lot_id?: number;
  load_order_id: number | null;
  product_name?: string;

  //Cree una tabla intermedia al pedo porque el lote tiene que estar asociado a un producto
  product_id: number;
  lot_number: number | null;
  expiration_date: string | null;
  expiration_date_notification: boolean;
  //Vendra del remito porque el remito es quien crea los lotes.
  provider_id: number | null;
  sale_units_equivalence: {
    minor: {
      quantity_in_base: 0;
    };
    mayor: {
      quantity_in_base: 0;
    };
  };

  has_lot_container: boolean;
  lot_container_id: number | null;

  is_parent_lot: boolean;
  parent_lot_id: number | null;

  lot_control: boolean;
  //Caracteristicas inmutables
  initial_stock_quantity: number;
  total_cost: number;
  cost_per_unit: number;
  is_sold_out: boolean;
  is_expired: boolean;

  providers?: {
    provider_name: string;
  };
  stock?: Stock[];
  prices?: Price[];


  current_stock_quantity?: number;


  download_total_cost: number | null;
  has_transport_cost_divided: boolean;
};

export type LotWithControl = BaseLot & {
  lot_control: true;
};

export type LotWithoutControl = BaseLot & {
  lot_control: false;
};

export type Lot = LotWithControl | LotWithoutControl;

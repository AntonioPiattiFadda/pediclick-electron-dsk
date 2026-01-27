import type { ProductPresentation } from "./productPresentation";

export type SellMeasurementMode = "QUANTITY" | "WEIGHT";

export interface Product {
  // Todo pertenece al bussines owner id porque si esta en el limbo es ahi y despues lo asigno a donde yo quiero,
  business_owner_id?: string;
  product_id?: number;
  product_name: string;
  //I will overwrite the previous only if previous stock is finished
  short_code: number | null;
  product_description: string | null;
  category_id: number | null;
  sub_category_id: number | null;
  brand_id: number | null;
  iva_id: number | null;
  barcode: number | null;
  public_image_id: number | null;
  public_image_src?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  observations: string | null;

  //NOTE El rinde es por producto o por remito?
  //NOTE La comision es por lote o por remito?

  // sell_measurement_mode: SellMeasurementMode;

  //Darle una vuelta a esto
  // equivalence_minor_mayor_selling: {
  //   minor: number | null;
  //   mayor: number | null;
  // };
  //   sale_unit_id: number | null;
  //I dont remember why i put this


  allow_stock_control: boolean;
  //If no lot control the system will use a single lot as if there was not.
  lot_control: boolean;

  //NEW
  // uses_lots: boolean;
  // tracks_stock: boolean;


  nameAndCode?: {
    name: string;
    short_code: number | null;
  };

  //El formato en que viene de base de datos.
  public_images?: {
    public_image_src: string;
  };
  categories?: {
    category_name: string;
  };
  sub_categories?: {
    sub_category_name: string;
  };

  brands?: {
    brand_name: string;
  };
  sale_units?: {
    sale_unit_name: string;
  };

  product_presentations?: Partial<ProductPresentation>[];

  // lots?: Lot[];
}



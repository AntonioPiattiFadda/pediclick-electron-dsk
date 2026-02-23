import { SellType, SellUnit } from ".";
import type { Lot } from "./lots";
import { Price } from "./prices";

//TODO Actualizar las funciónes en base de datos para que el sellType sea de la presentación

export type ProductPresentation = {
    product_presentation_id: number;
    product_presentation_name: string;
    product_id: number;
    short_code: number;
    created_at: string;
    updated_at: string;

    //Esto es mayor o menor
    sell_type: SellType;
    bulk_quantity_equivalence: number | null;

    //Esto es kilo o unidad
    sell_unit: SellUnit;


    lots?: Lot[];

    products?: {
        product_name: string;
    };

    prices?: Price[];

}
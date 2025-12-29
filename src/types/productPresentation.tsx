import type { Lot } from "./lots";
import { Price } from "./prices";

export type ProductPresentation = {
    product_presentation_id: number;
    product_presentation_name: string;
    product_id: number;
    short_code: number;
    created_at: string;
    updated_at: string;

    bulk_quantity_equivalence: number | null;


    lots?: Lot[];

    products?: {
        product_name: string;
    };

    prices?: Price[];

}
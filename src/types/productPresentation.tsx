import type { SellType, SellUnit } from ".";
import type { Lot } from "./lots";
import type { Price } from "./prices";

export type ProductPresentation = {
    product_presentation_id: number | null;
    product_presentation_name: string;
    product_id: number;
    short_code: number;
    created_at: string;
    updated_at: string;

    bulk_quantity_equivalence: number | null;
    sell_unit: SellUnit;
    sell_type: SellType;

    // allow_price_edition: boolean;
    // minimum_price: number | null;

    prices: Price[];
    lots?: Lot[];

    products?: {
        product_name: string;
    };

}
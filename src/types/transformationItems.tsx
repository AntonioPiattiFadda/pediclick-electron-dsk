import { Lot } from "./lots";
import type { ProductPresentation } from "./productPresentation";
import type { Product } from "./products";

export type TransformationItems = {
    transformation_item_id: number;
    transformation_id: number;

    product_id: number | null;
    product_presentation_id: number | null;
    lot_id: number | null;

    stock_id: number | null;

    is_origin: boolean;
    quantity: number | null;


    bulk_quantity_equivalence: number | null;

    final_cost_per_unit: number | null;
    final_cost_per_bulk: number | null;
    final_cost_total: number | null;

    max_quantity: number | null;
    location_id: number | null;
    // lot_container_id: number | null;
    // lot_container_quantity: number | null;

    product?: Partial<Product> | null;
    product_presentation: Partial<ProductPresentation> | null;

    lot: {
        lot_id: number | null,
        final_cost_per_unit: number | null,
        final_cost_per_bulk: number | null,
        final_cost_total: number | null,
        stock_id: number | null,
        max_quantity: number | null,
        lot: Lot | undefined | null,
        provider_id: number | null,
        expiration_date: string | null,
        expiration_date_notification: boolean,
    } | null;
}
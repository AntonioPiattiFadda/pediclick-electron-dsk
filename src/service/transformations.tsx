import { TransformationItems } from "@/types/transformationItems";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import { Transformation } from "@/types/transformation";

export async function createTransformation(transformation: Omit<Transformation, 'created_at'>, fromTransformationItems: TransformationItems[], toTransformationItems: TransformationItems[], locationId: number | null) {
    const businessOwnerId = await getBusinessOwnerId();


    const adaptedFromTransformationItems: Omit<TransformationItems, 'product' | 'product_presentation'>[] = fromTransformationItems.map((it) => ({
        transformation_item_id: it.transformation_item_id,
        transformation_id: it.transformation_id,
        product_id: it.product_id,
        product_presentation_id: it.product_presentation_id,
        lot_id: it.lot_id,
        stock_id: it.stock_id,
        is_origin: it.is_origin,
        quantity: it.quantity,
        max_quantity: it.max_quantity,
        bulk_quantity_equivalence: it.bulk_quantity_equivalence,
        final_cost_per_unit: it.final_cost_per_unit,
        final_cost_per_bulk: it.final_cost_per_bulk,
        final_cost_total: it.final_cost_total,
        location_id: it.location_id,
        lot: null,
    }));

    const adaptedToTransformationItems: Omit<TransformationItems, 'product' | 'product_presentation'>[] = toTransformationItems.map((it) => ({
        transformation_item_id: it.transformation_item_id,
        transformation_id: it.transformation_id,
        product_id: it.product_id,
        product_presentation_id: it.product_presentation_id,
        lot_id: it.lot_id,
        stock_id: it.stock_id,
        is_origin: it.is_origin,
        quantity: it.quantity,
        max_quantity: it.max_quantity,
        bulk_quantity_equivalence: it.bulk_quantity_equivalence,
        final_cost_per_unit: it.final_cost_per_unit,
        final_cost_per_bulk: it.final_cost_per_bulk,
        final_cost_total: it.final_cost_total,
        location_id: locationId,
        lot: {
            product_id: it.product_id || null,
            provider_id: it?.lot?.provider_id || null,
            product_presentation_id: it.product_presentation_id || null,
            expiration_date: it?.lot?.expiration_date || null,
            parent_lot_id: it?.lot?.lot_id || null,
            final_cost_per_unit: it?.lot?.final_cost_per_unit || null,
            final_cost_per_bulk: it?.lot?.final_cost_per_bulk || null,
            final_cost_total: it?.lot?.final_cost_total || null,
            expiration_date_notification: it?.lot?.expiration_date_notification ?? false,
            is_parent_lot: false,
            lot_id: it.lot_id,
            stock_id: it.stock_id,
            max_quantity: it.max_quantity,
            lot: null,

        },
    }));

    const adaptedTranformationData = {
        ...transformation,
        business_owner_id: businessOwnerId,
    };

    const { data, error } = await supabase.rpc('create_transformation', {
        p_transformation_data: adaptedTranformationData,
        p_transformation_items: [...adaptedFromTransformationItems, ...adaptedToTransformationItems],
    });

    if (error) {
        throw error;
    }

    return data;
}

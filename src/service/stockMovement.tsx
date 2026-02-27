import { StockMovement } from "@/types/stockMovements";
import { supabase } from ".";

export const createWasteStockMovement = async (formData: Omit<StockMovement, "stock_movement_id">) => {
    console.log("Creating waste stock movement with data:", formData);

    const { data: stockMovementData, error: stockMovementError } = await supabase
        .rpc("create_stock_movement_waste", {
            p_lot_id: formData.lot_id,
            p_stock_id: formData.stock_id,
            p_movement_type: formData.movement_type,
            p_quantity: formData.quantity,
            p_qty_in_base_units: formData.qty_in_base_units,
            p_product_presentation_id: formData.product_presentation_id,
            p_from_location_id: formData.from_location_id ?? null,
            p_to_location_id: formData.to_location_id ?? null,
            p_should_notify_owner: formData.should_notify_owner ?? false,
            p_created_by: formData.created_by ?? null,
        });

    if (stockMovementError) {
        throw new Error(stockMovementError.message);
    }

    return stockMovementData;
};

export type LotForWaste = {
    lot_id: number;
    created_at: string;
    stock: Array<{ stock_id: number; quantity: number; location_id: number }>;
};

export const getLotsForProduct = async (productId: number, locationId: number): Promise<LotForWaste[]> => {
    const { data, error } = await supabase
        .from("lots")
        .select(`
            lot_id,
            created_at,
            stock!inner(
                stock_id,
                quantity,
                location_id
            )
        `)
        .eq("product_id", productId)
        .eq("is_sold_out", false)
        .eq("stock.location_id", locationId)
        .gt("stock.quantity", 0);

    if (error) throw new Error(error.message);
    return (data ?? []) as LotForWaste[];
};

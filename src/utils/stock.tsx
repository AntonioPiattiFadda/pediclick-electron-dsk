import { Lot } from "@/types/lots";

export const getLotData = (lots: Lot[], lotId: number | null, locationId: number) => {

    let lot;

    if (lotId) {
        lot = lots.find((l) => l.lot_id === lotId);

    } else {
        lot = lots[0];
    }

    const lotStock = lot?.stock?.filter((s) => Number(s.quantity) > 0 && s.location_id === locationId)
        .find((s) => Number(s.location_id) === locationId);

    const max_quantity = lotStock ? Number(lotStock.quantity) - (lotStock?.reserved_for_selling_quantity ?? 0) - (lotStock?.reserved_for_transferring_quantity ?? 0) : null;

    return {
        lot_id: lot?.lot_id || null,
        final_cost_per_unit: lot?.final_cost_per_unit || null,
        final_cost_per_bulk: lot?.final_cost_per_bulk || null,
        final_cost_total: lot?.final_cost_total || null,
        stock_id: lotStock?.stock_id || null,
        max_quantity: max_quantity,
        lot: lot,
        provider_id: lot?.provider_id || null,
        expiration_date: lot?.expiration_date,
        expiration_date_notification: lot?.expiration_date_notification ?? false,
    }
}
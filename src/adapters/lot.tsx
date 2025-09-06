/* eslint-disable @typescript-eslint/no-explicit-any */
export const adaptLotData = (lot: any) => {
  return {
    expiration_date: lot.expiration_date ?? null,
    expiration_date_notification: lot.expiration_date_notification ?? false,
    initial_stock_quantity: lot.initial_stock_quantity ?? 0,
    is_sold_out: lot.is_sold_out ?? false,
    lot_container_id: lot.lot_container_id ?? null,
    lot_control: lot.lot_control ?? false,
    lot_number: lot.lot_number ?? null,
    prices: lot.prices ?? [],
    provider_id: lot.provider_id ?? null,
    sale_units_equivalence: lot.sale_units_equivalence ?? {
      minor: {},
      mayor: {},
    },
    stock: lot.stock ?? [],
    stock_movement: lot.stock_movement ?? [],
    waste: lot.waste ?? null,
  };
};

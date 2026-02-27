import { handleSupabaseError } from "@/utils/handleSupabaseErrors";
import { supabase } from ".";
import { getOrganizationId } from "./profiles";
import type { SubapaseConstrains } from "@/types/shared";

export const productPresentationConstraints: SubapaseConstrains[] = [{
  value: "unique_shortcode_per_owner",
  errorMsg: "El código corto ya está en uso para otra presentación de producto.",
},
{
  value: "unique_presentation_per_owner_and_product",
  errorMsg: "Ya existe una presentación con ese nombre para este producto.",
}
];

// Difieren en la app escritorio y esta.
export const getProductPresentations = async (
  productId: number | null,
  isFetchWithLots: boolean = false,
  isFetchedWithLotContainersLocation: boolean = false,
  locationId: number | null = null,
) => {

  console.log("Fetching product presentations with params:", { productId, isFetchWithLots, isFetchedWithLotContainersLocation, locationId });

  if (!productId) {
    return [];
  }

  const organizationId = await getOrganizationId();

  // Presentations are always fetched with prices only (no lots join).
  // Lots are fetched separately by product_id (new model: lots are per-product).
  const presentationsSelect = isFetchWithLots
    ? `
        product_presentation_id,
        product_presentation_name,
        short_code,
        sell_type,
        bulk_quantity_equivalence,
        prices(price_id, location_id, price, qty_per_price, logic_type, observations, valid_until, disabled_prices(location_id), enabled_prices_clients(client_id))
      `
    : `
        product_presentation_id,
        product_presentation_name,
        short_code,
        sell_type,
        bulk_quantity_equivalence,
        prices(price_id, location_id, price, qty_per_price, logic_type, observations, valid_until, disabled_prices(location_id), enabled_prices_clients(client_id))
      `;

  const { data: presentations, error } = await supabase
    .from("product_presentations")
    .select(presentationsSelect)
    .is("deleted_at", null)
    .eq("organization_id", organizationId)
    .eq("product_id", productId);


  if (error) throw new Error(error.message);

  if (!isFetchWithLots) {
    return presentations;
  }

  // Fetch lots by product_id (not product_presentation_id) — new base-unit model.
  // All presentations for a product share the same pool of lots.
  if (isFetchedWithLotContainersLocation) {
    const { data: lots, error: lotsError } = await supabase
      .from("lots")
      .select(`
        lot_id,
        created_at,
        is_sold_out,
        final_cost_per_unit,
        final_cost_per_bulk,
        final_cost_total,
        stock!inner(*,
          lot_containers_stock(*)
        )
      `)
      .eq("product_id", productId)
      .eq("stock.location_id", locationId)
      .gt("stock.quantity", 0);

    if (lotsError) throw new Error(lotsError.message);

    return (presentations ?? []).map((p) => ({ ...p, lots: lots ?? [] }));
  }

  const { data: lots, error: lotsError } = await supabase
    .from("lots")
    .select(`
      lot_id,
      created_at,
      initial_stock_quantity,
      is_sold_out,
      is_finished,
      stock!inner(
        quantity,
        stock_id,
        location_id,
        reserved_for_transferring_quantity,
        reserved_for_selling_quantity
      )
    `)
    .eq("product_id", productId)
    .eq("stock.location_id", locationId)
    .gt("stock.quantity", 0);

  if (lotsError) throw new Error(lotsError.message);

  // Attach the same lot pool to every presentation
  return (presentations ?? []).map((p) => ({ ...p, lots: lots ?? [] }));
};

export const getProductPresentationsSummary = async (
  productId: number
): Promise<{ product_presentation_id: number; product_presentation_name: string; bulk_quantity_equivalence: number | null }[]> => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("product_presentations")
    .select("product_presentation_id, product_presentation_name, bulk_quantity_equivalence")
    .is("deleted_at", null)
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .order("bulk_quantity_equivalence", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createProductPresentation = async (name: string, shortCode: number | null, productId: number, bulkQuantityEquivalence: number | null) => {
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase
    .from("product_presentations")
    .insert({ product_presentation_name: name, short_code: shortCode, organization_id: organizationId, product_id: productId, bulk_quantity_equivalence: bulkQuantityEquivalence })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, productPresentationConstraints);
  }

  return data;

};

export const deleteProductPresentation = async (id: string | number) => {
  const { error } = await supabase
    .from("product_presentations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("product_presentation_id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};


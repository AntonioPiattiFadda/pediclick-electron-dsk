import { adaptProductsForClient } from "@/adapters/products";
import type { Product } from "@/types/products";
import { supabase } from ".";
import { getOrganizationId } from "./profiles";


export const getAllProducts = async () => {
  const organizationId = await getOrganizationId();
  const { data: dbProducts, error } = await supabase
    .from("products")
    .select(`
  *,
  public_images(public_image_src),
  categories(category_name),
  sub_categories(sub_category_name),
  brands(brand_name),
  product_presentations!inner (
    *,
    lots(
      *,
      lot_containers_location(*),
      stock(*)
    )
  )
`)
    .is("product_presentations.deleted_at", null)
    .is("deleted_at", null)
    .eq("organization_id", organizationId)
    .order("product_name", { ascending: true });



  console.log("dbProducts", dbProducts, error);

  if (error) {
    throw new Error(error.message);
  }


  const products = adaptProductsForClient(dbProducts);
  console.log("adaptedProducts", products);


  return { products, error };
};

export const getProduct = async (productId: number) => {
  const { data: dbProduct, error } = await supabase
    .from("products")
    .select(
      `
      *,
      public_images(public_image_src),
      categories(category_name),
      sub_categories(sub_category_name),
      brands(brand_name),
      lots(
        *,
        stock(*)
      )
      `
    )
    .eq("product_id", productId)
    .is("deleted_at", null) // ✅ Solo productos activos
    .single();

  if (error) {
    console.log("getProduct error", error);
    throw new Error(error.message);
  }
  console.log("XAtaptar", dbProduct);

  const product = adaptProductsForClient([dbProduct])[0];

  console.log("adaptedProductSingle", product);

  return { product, error };
};

export const updateProduct = async (
  productId: number,
  productData: Partial<Product>
) => {
  const { data, error } = await supabase
    .from("products")
    .update(productData)
    .eq("product_id", productId);

  console.log("updateProduct", data, error);

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
};

export const createProduct = async (product: Product) => {
  const organizationId = await getOrganizationId();

  const { data: newProduct, error: productError } = await supabase
    .from("products")
    .insert({
      organization_id: organizationId,
      ...product,
    })
    .select()
    .single();

  if (productError) {
    console.error("productError", productError);
    throw new Error("Error al crear el producto");
  }

  return {
    ...newProduct,
  };
};

export const deleteProduct = async (productId: string | number) => {
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date() })
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

export const getProductsByShortCode = async (
  shortCode: string
) => {
  const organizationId = await getOrganizationId();

  const { data: dbProducts, error } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .eq("organization_id", organizationId)
    .order("product_name", { ascending: true })
    .eq("short_code", shortCode);

  // .ilike("short_code", `%${shortCode}%`);

  console.log(dbProducts, error);

  if (error) throw new Error(error.message);

  const products = adaptProductsForClient(dbProducts || []);
  return { products, error: null };
};

// function escapeLike(s: string) {
//   // evita que % y _ rompan el patrón ILIKE
//   return s.replace(/[%_]/g, (m) => `\\${m}`);
// }

export const getProductsByName = async (name: string, withLots: boolean) => {
  const organizationId = await getOrganizationId();

  const q = name.trim();
  const isNumeric = /^\d+$/.test(q);

  // Base de la consulta
  let query = supabase
    .from("products")
    .select(`
    product_id,
    product_name,
    short_code,
    updated_at,
    public_images(public_image_src)
    ${withLots ? ", lots(lot_id,created_at, stock(stock_id, quantity))" : ""}
  `)
    .is("deleted_at", null)
    .eq("organization_id", organizationId)
    .order("product_name", { ascending: true })
    .limit(2);


  if (withLots) {
    query = query.eq("lots.is_sold_out", false);
  }

  // Condición según tipo de búsqueda
  if (isNumeric) {
    query = query.eq("short_code", parseInt(q));
  } else {
    query = query.ilike("product_name", `%${q}%`);
  }

  // Ejecutar la consulta
  const { data: dbProducts, error } = await query;

  if (error) throw new Error(error.message);

  const products = adaptProductsForClient(dbProducts || []);
  return { products, error: null };
};



export const checkIfShortCodeIsAvailable = async (
  shortCode: number,
  productId?: number
) => {
  const organizationId = await getOrganizationId();

  const { data, error } = await supabase.rpc('get_products_stock_status_by_short_code', {
    p_short_code: shortCode,
    p_organization_id: organizationId,
  });


  if (error) {
    console.error("checkIfShortCodeIsAvailable RPC error", error);
    throw new Error(error.message);
  }

  const filteredProducts = data ? data.filter((p: {
    product_id: number;
    product_name: string;
    is_sold_out: boolean;
  }) => p.product_id !== productId) : [];

  const isAvailable = filteredProducts.length === 0 || filteredProducts === null;

  return {
    isAvailable, products: filteredProducts
  };
};
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Product } from "../types/products";

export const adaptProductForDb = (product: any): Product => {
  return {
    product_name: product.product_name,
    product_description: product.product_description,
    allow_stock_control: product.allow_stock_control,
    category_id: Number(product.category_id) || null,
    sub_category_id: Number(product.sub_category_id) || null,
    short_code: Number(product.short_code) || null,
    barcode: Number(product.barcode) || null,
    brand_id: Number(product.brand_id) || null,
    lot_control: product.lot_control || null,
    public_image_id: product.public_image_id || null,
    observations: product.observations || null,
    created_at: product.created_at || null,
    updated_at: product.updated_at || null,
    iva_id: product.iva_id || null,
  };
};

export const adaptProductsForClient = (products: any): Product[] => {
  return products.map((product: any) => ({
    product_id: product.product_id,
    short_code: product.short_code,
    product_name: product.product_name,
    category_id: product.category_id,
    sub_category_id: product.sub_category_id,
    brand_id: product.brand_id,
    sale_unit_id: product.sale_unit_id,
    barcode: product.barcode,
    public_image_id: product.public_image_id,
    store_id: product.store_id,
    allow_stock_control: product.allow_stock_control,
    lot_control: product.lot_control,
    sell_measurement_mode: product.sell_measurement_mode,
    public_images: product.public_images,
    categories: product.categories,
    sub_categories: product.sub_categories,
    brands: product.brands,
    sale_units: product.sale_units,
    lots: product.lots || null,
    // public_images?: {
    //   public_image_src: string;
    // };
    // categories?: {
    //   category_name: string;
    // };
    // sub_categories?: {
    //   sub_category_name: string;
    // };

    // brands?: {
    //   brand_name: string;
    // };
    // sale_units?: {
    //   sale_unit_name: string;
    // };
  }));
};

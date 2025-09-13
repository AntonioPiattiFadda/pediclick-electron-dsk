import { useQuery } from "@tanstack/react-query";
import { useOrderContext } from "../../context/OrderContext";
import { getAllProducts } from "../../service/products";
import { Lot } from "../../types/lots";
import { Stock } from "../../types/stocks";

const STORE_ID = 27; // Reemplaza con el ID del local actual
const USER_ROLE = "OWNER"; // Reemplaza con el rol del usuario actual

const ProductsFetcher = () => {
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await getAllProducts(USER_ROLE);
      // Ensure each product has seller_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.products.map((product: any) => ({
        // seller_id: product.seller_id ?? "", // Provide a fallback or handle as needed
        ...product,
      }));
    },
  });

  const filteredProducts = products.filter((product) => {
    return product?.lots?.some((lot: Lot) => {
      return lot?.stock?.some((stock: Stock) => {
        return stock.store_id === STORE_ID;
      });
    });
  });

  const { setCurrentOrderItem } = useOrderContext();

  if (isLoading) return <div>Loading products...</div>;
  if (isError) return <div>Error loading products</div>;
  return (
    <div>
      {filteredProducts.map((product) => (
        <div key={product.product_id}>
          {product.product_name}{" "}
          <span>
            En Stock:{" "}
            {product.lots?.[0]?.stock?.find(
              (stock: Stock) => stock.store_id === STORE_ID
            )?.current_quantity || 0}
          </span>
          <button
            onClick={() =>
              setCurrentOrderItem({
                product_id: product.product_id,
                lot_id: product.lots?.[0]?.lot_id || 0,
                price_id: product.lots?.[0]?.price_id || 0,
                //La va a determinar la balanza si es producto por kg
                //Si es por unidad lo va a seleccionar el usuario
                //Se calculaara unit_price en base a esto
                quantity: 1,
                unit_price: product.lots?.[0]?.price || 0,
                subtotal: 0,
                discount: 0,
                tax: 0,
                total_price: 0,
                created_at: new Date().toISOString(),
                ...product,
              })
            }
          >
            Select
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProductsFetcher;

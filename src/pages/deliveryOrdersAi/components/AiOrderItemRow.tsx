import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/shared/MoneyInput";
import ProductSelector from "@/components/shared/selectors/productSelector";
import {
  ProductPresentationSelectorRoot,
  SelectProductPresentation,
} from "@/components/shared/selectors/productPresentationSelector";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { OrderItem } from "@/types/orderItems";
import { Product } from "@/types/products";
import { ProductPresentation } from "@/types/productPresentation";
import { DollarSign, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface AiOrderItemRowProps {
  item: OrderItem;
  onUpdate: (updatedItem: OrderItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function AiOrderItemRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: AiOrderItemRowProps) {
  const { handleGetLocationId } = useGetLocationData();

  const [selectedProduct, setSelectedProduct] = useState<Product>({
    product_id: item.product_id,
    product_name: item.product_name,
  } as Product);

  const [productPresentation, setProductPresentation] = useState<
    Partial<ProductPresentation>
  >({
    product_presentation_id: item.product_presentation_id,
    product_presentation_name: item.product_presentation_name,
  });

  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [price, setPrice] = useState<number>(item.price || 0);

  // Calculate subtotal whenever quantity or price changes
  useEffect(() => {
    const newSubtotal = quantity * price;
    onUpdate({
      ...item,
      product_id: selectedProduct.product_id!,
      product_name: selectedProduct.product_name!,
      product_presentation_id: productPresentation.product_presentation_id!,
      product_presentation_name: productPresentation.product_presentation_name!,
      quantity,
      price,
      subtotal: newSubtotal,
      total: newSubtotal,
    });
  }, [quantity, price, selectedProduct, productPresentation]);

  const handleProductChange = (product: Product) => {
    setSelectedProduct(product);
    // Reset presentation when product changes
    setProductPresentation({});
  };

  const handlePresentationChange = (presentation: Partial<ProductPresentation>) => {
    setProductPresentation(presentation);
  };

  const handleShowPrices = () => {
    // TODO: Open modal/popover showing all prices for selected presentation
    console.log("Show prices for:", productPresentation);
  };

  const locationId = handleGetLocationId();
  const productId = selectedProduct.product_id!;

  return (
    <div className="grid grid-cols-[2fr_1.5fr_100px_120px_120px_80px] gap-2 items-center py-2 border-b">
      {/* Product Selector */}
      <div className="min-w-[300px] ">
        <ProductSelector
          value={selectedProduct}
          onChange={handleProductChange}
          disabled
        />
      </div>

      {/* Presentation Selector */}
      <div className="min-w-[350px]">
        {productId && (
          <ProductPresentationSelectorRoot
            locationId={locationId}
            productId={productId}
            value={productPresentation}
            onChange={handlePresentationChange}
            isFetchWithLots={true}
            isFetchWithLotContainersLocation={false}
          >
            <SelectProductPresentation />
          </ProductPresentationSelectorRoot>
        )}
      </div>

      {/* Quantity Input */}
      <Input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="text-center"
      />

      {/* Price Input */}
      <MoneyInput
        value={price}
        onChange={(value) => setPrice(value)}
      />

      {/* Total (read-only) */}
      <div className="text-right font-medium">
        ${(quantity * price).toFixed(2)}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShowPrices}
          title="Ver precios"
          className="h-8 w-8"
        >
          <DollarSign className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? "Eliminar" : "Debe haber al menos un producto"}
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

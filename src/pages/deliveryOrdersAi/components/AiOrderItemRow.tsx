import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/shared/MoneyInput";
import ProductSelector from "@/components/shared/selectors/productSelector";
import {
  ProductPresentationSelectorRoot,
  SelectProductPresentation,
} from "@/components/shared/selectors/productPresentationSelector";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { useProductItemEditor } from "@/hooks/useProductItemEditor";
import { OrderItem } from "@/types/orderItems";
import { Product } from "@/types/products";
import { ProductPresentation } from "@/types/productPresentation";
import { Lot } from "@/types/lots";
import { LotSelector } from "@/components/shared/LotSelector";
import { PricesSelector } from "@/components/shared/PricesSelector";
import { Trash2 } from "lucide-react";
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
  const locationId = handleGetLocationId();

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

  const editor = useProductItemEditor({
    productId: selectedProduct.product_id ?? null,
    productPresentationId:
      productPresentation.product_presentation_id ?? null,
    locationId,
    prices: productPresentation.prices,
    lots: productPresentation.lots as Lot[] | undefined,
    unifyLots: false,
    initialQuantity: item.quantity,
    initialPrice: item.price,
  });

  // Emit update whenever relevant editor state or selection changes
  useEffect(() => {
    const selectedPrice = editor.filteredPrices.find(
      (p) => p.price_id === editor.selectedPriceId
    );
    onUpdate({
      ...item,
      product_id: selectedProduct.product_id!,
      product_name: selectedProduct.product_name!,
      product_presentation_id: productPresentation.product_presentation_id!,
      product_presentation_name: productPresentation.product_presentation_name!,
      quantity: editor.quantity,
      price: editor.price,
      logic_type: selectedPrice?.logic_type ?? item.logic_type,
      lot_id: editor.selectedLotId,
      stock_id: editor.selectedStockId,
      subtotal: editor.subtotal,
      total: editor.subtotal,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editor.quantity,
    editor.price,
    editor.selectedLotId,
    selectedProduct,
    productPresentation,
  ]);

  const handleProductChange = (product: Partial<Product>) => {
    setSelectedProduct(product as Product);
    setProductPresentation({});
  };

  const handlePresentationChange = (
    presentation: Partial<ProductPresentation> | null
  ) => {
    setProductPresentation(presentation ?? {});
  };

  const productId = selectedProduct.product_id!;

  return (
    <div className="grid grid-cols-[2fr_1.5fr_120px_80px_240px_100px_50px] gap-2 items-center py-2 border-b">
      {/* Product Selector */}
      <div className="min-w-[300px]">
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

      {/* Lot Selector */}
      <div>
        <LotSelector
          lots={editor.lots}
          selectedLotId={editor.selectedLotId}
          onSelectLot={editor.setSelectedLotId}
        />
      </div>

      {/* Quantity Input */}
      <Input
        type="number"
        min="1"
        value={editor.quantity}
        onChange={(e) => editor.handleQuantityChange(Number(e.target.value))}
        className="text-center"
      />

      {/* Price Area: select + manual input */}
      <div className="flex flex-col gap-1">
        {editor.filteredPrices.length > 0 ? (
          <PricesSelector
            prices={editor.filteredPrices}
            selectedPriceId={editor.selectedPriceId}
            onSelectPrice={editor.handleSelectPrice}
            isWeight={productPresentation.sell_unit === "BY_WEIGHT"}
          />
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Sin precios disponibles
          </span>
        )}

        {/* Manual price override */}
        <MoneyInput
          value={editor.price || undefined}
          onChange={(value) => editor.setPrice(value ?? 0)}
          resetKey={`${selectedProduct?.product_id}-${productPresentation?.product_presentation_id}`}
        />
      </div>

      {/* Total (read-only) */}
      <div className="text-right font-medium text-sm">
        ${editor.subtotal.toFixed(2)}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
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

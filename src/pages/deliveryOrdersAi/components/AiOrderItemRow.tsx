import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/shared/MoneyInput";
import ProductSelector from "@/components/shared/selectors/productSelector";
import {
  ProductPresentationSelectorRoot,
  SelectProductPresentation,
} from "@/components/shared/selectors/productPresentationSelector";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { OrderItem } from "@/types/orderItems";
import { PriceType } from "@/types/prices";
import { Product } from "@/types/products";
import { ProductPresentation } from "@/types/productPresentation";
import { priceLogicTypeOpt } from "@/constants";
import { resolveEffectivePrice } from "@/utils/prices";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [price, setPrice] = useState<number>(item.price || 0);
  const [sellPriceType, setSellPriceType] = useState<PriceType>(
    item.price_type || "MINOR"
  );
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);

  const filteredPrices = useMemo(() => {
    const allPrices = productPresentation.prices || [];
    const somePriceHasLocationId = allPrices.some((p) => p.location_id);
    const firstFiltered = somePriceHasLocationId
      ? allPrices.filter((p) => p.location_id === locationId)
      : allPrices;
    return firstFiltered.filter((p) => p.price_type === sellPriceType);
  }, [productPresentation, sellPriceType, locationId]);

  // Auto-select first matching price when presentation or price type changes
  useEffect(() => {
    const firstPrice = filteredPrices[0] || null;
    setSelectedPriceId(firstPrice?.price_id ?? null);
    setPrice(firstPrice ? firstPrice.price / (firstPrice.qty_per_price ?? 1) : 0);
  }, [filteredPrices]);

  // Emit update whenever relevant state changes
  useEffect(() => {
    const newSubtotal = quantity * price;
    const selectedPrice = filteredPrices.find((p) => p.price_id === selectedPriceId);
    onUpdate({
      ...item,
      product_id: selectedProduct.product_id!,
      product_name: selectedProduct.product_name!,
      product_presentation_id: productPresentation.product_presentation_id!,
      product_presentation_name: productPresentation.product_presentation_name!,
      quantity,
      price,
      price_type: sellPriceType,
      logic_type: selectedPrice?.logic_type ?? item.logic_type,
      subtotal: newSubtotal,
      total: newSubtotal,
    });
  }, [quantity, price, selectedProduct, productPresentation, sellPriceType]);

  const handleProductChange = (product: Partial<Product>) => {
    setSelectedProduct(product as Product);
    setProductPresentation({});
  };

  const handlePresentationChange = (
    presentation: Partial<ProductPresentation> | null
  ) => {
    setProductPresentation(presentation ?? {});
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    const { effectivePrice, price_id } = resolveEffectivePrice(
      newQty,
      selectedPriceId,
      filteredPrices
    );
    if (price_id) {
      setPrice(effectivePrice);
      setSelectedPriceId(price_id);
    }
  };

  const handleSelectPrice = (priceId: number) => {
    const found = filteredPrices.find((p) => p.price_id === priceId);
    if (found) {
      setSelectedPriceId(priceId);
      setPrice(found.price / (found.qty_per_price ?? 1));
    }
  };

  const productId = selectedProduct.product_id!;

  return (
    <div className="grid grid-cols-[2fr_1.5fr_80px_240px_100px_50px] gap-2 items-center py-2 border-b">
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

      {/* Quantity Input */}
      <Input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => handleQuantityChange(Number(e.target.value))}
        className="text-center"
      />

      {/* Price Area: type checkboxes + select + manual input */}
      <div className="flex flex-col gap-1">
        {/* MINOR / MAYOR checkboxes */}
        <div className="flex gap-3 items-center text-xs text-muted-foreground">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <Checkbox
              checked={sellPriceType === "MAYOR"}
              onCheckedChange={(checked) =>
                setSellPriceType(checked ? "MAYOR" : "MINOR")
              }
            />
            Mayorista
          </label>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <Checkbox
              checked={sellPriceType === "MINOR"}
              onCheckedChange={(checked) =>
                setSellPriceType(checked ? "MINOR" : "MAYOR")
              }
            />
            Minorista
          </label>
        </div>

        {/* Price Select */}
        {filteredPrices.length > 0 ? (
          <Select
            value={selectedPriceId?.toString() || ""}
            onValueChange={(value) => handleSelectPrice(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar precio" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Precios</SelectLabel>
                {filteredPrices.map((p) => (
                  <SelectItem
                    key={p.price_id}
                    value={p.price_id?.toString() || ""}
                  >
                    <span className="text-xs">
                      #{p.price_number} — ${p.price / (p.qty_per_price ?? 1)} —{" "}
                      {priceLogicTypeOpt.find((o) => o.value === p.logic_type)
                        ?.label ?? p.logic_type}{" "}
                      — &gt;={p.qty_per_price}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Sin precios disponibles
          </span>
        )}

        {/* Manual price override */}
        <MoneyInput
          value={price || undefined}
          onChange={(value) => {
            setPrice(value ?? 0);
            setSelectedPriceId(null);
          }}
          resetKey={`${selectedProduct?.product_id}-${productPresentation?.product_presentation_id}-${sellPriceType}`}
        />
      </div>

      {/* Total (read-only) */}
      <div className="text-right font-medium text-sm">
        ${(quantity * price).toFixed(2)}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          title={
            canRemove ? "Eliminar" : "Debe haber al menos un producto"
          }
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

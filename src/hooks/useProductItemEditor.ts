import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductPresentations } from "@/service/productPresentations";
import { resolveEffectivePrice } from "@/utils/prices";
import type { Price, PriceType } from "@/types/prices";
import type { Lot } from "@/types/lots";

export interface UseProductItemEditorOptions {
  productId: number | null;
  productPresentationId: number | null;
  locationId: number;

  // Optional data override — when provided, skips internal fetch
  prices?: Price[];
  lots?: Lot[];

  // Lot behaviour
  unifyLots?: boolean; // default: false → shows lot selector

  // Seed values (only applied on first render)
  initialQuantity?: number;
  initialPrice?: number;
  initialPriceType?: PriceType;
}

export interface UseProductItemEditorReturn {
  // Quantity
  quantity: number;
  handleQuantityChange: (qty: number) => void; // auto-recalculates price

  // Price type (MINOR / MAYOR)
  sellPriceType: PriceType;
  setSellPriceType: (type: PriceType) => void;

  // Prices
  filteredPrices: Price[];
  selectedPriceId: number | null;
  handleSelectPrice: (priceId: number) => void;
  price: number;
  setPrice: (price: number) => void; // manual override, clears selectedPriceId

  // Lots (empty / null when unifyLots=true)
  lots: Lot[];
  selectedLotId: number | null;
  setSelectedLotId: (id: number | null) => void;
  selectedStockId: number | null;

  // Stock
  availableStock: number; // sum of all lots (unified) OR stock of selected lot

  // Meta
  isLoading: boolean;
  subtotal: number; // quantity * price
}

export function useProductItemEditor({
  productId,
  productPresentationId,
  locationId,
  prices: externalPrices,
  lots: externalLots,
  unifyLots = false,
  initialQuantity = 1,
  initialPrice,
  initialPriceType = "MINOR",
}: UseProductItemEditorOptions): UseProductItemEditorReturn {
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [sellPriceType, setSellPriceType] = useState<PriceType>(initialPriceType);
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [price, setPrice] = useState<number>(initialPrice ?? 0);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);

  // Only fetch internally when no external data is provided
  const shouldFetchInternally =
    externalPrices === undefined &&
    externalLots === undefined &&
    !!productId &&
    !!productPresentationId;

  const { data: fetchedPresentations, isLoading } = useQuery({
    queryKey: ["product_presentations", productId, locationId],
    queryFn: () => getProductPresentations(productId, true, false, locationId),
    enabled: shouldFetchInternally,
  });

  // Find the matching presentation from the fetched list
  const fetchedPresentation = useMemo(() => {
    if (!fetchedPresentations || !productPresentationId) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (fetchedPresentations as any[]).find(
      (p) => p.product_presentation_id === productPresentationId
    ) ?? null;
  }, [fetchedPresentations, productPresentationId]);

  // External data takes priority; fall back to internally fetched data
  const allPrices: Price[] = useMemo(() => {
    if (externalPrices !== undefined) return externalPrices;
    return (fetchedPresentation?.prices as Price[]) ?? [];
  }, [externalPrices, fetchedPresentation]);

  const allLots: Lot[] = useMemo(() => {
    if (externalLots !== undefined) return externalLots;
    return (fetchedPresentation?.lots as Lot[]) ?? [];
  }, [externalLots, fetchedPresentation]);

  // Filter prices by price type and location
  const filteredPrices = useMemo(() => {
    const somePriceHasLocationId = allPrices.some((p) => p.location_id);
    const locationFiltered = somePriceHasLocationId
      ? allPrices.filter((p) => p.location_id === locationId)
      : allPrices;
    return locationFiltered.filter((p) => p.price_type === sellPriceType);
  }, [allPrices, sellPriceType, locationId]);

  // Auto-select first price when available prices change (new presentation or price type)
  useEffect(() => {
    const first = filteredPrices[0] ?? null;
    setSelectedPriceId(first?.price_id ?? null);
    setPrice(first ? first.price / (first.qty_per_price ?? 1) : 0);
  }, [filteredPrices]);

  // Auto-select first lot/stock when lots change
  useEffect(() => {
    if (unifyLots) {
      setSelectedLotId(null);
      setSelectedStockId(null);
      return;
    }
    const firstLot = allLots[0] ?? null;
    const firstStock = firstLot?.stock?.[0] ?? null;
    setSelectedLotId(firstLot?.lot_id ?? null);
    setSelectedStockId(firstStock?.stock_id ?? null);
  }, [allLots, unifyLots]);

  // Computed available stock
  const availableStock = useMemo(() => {
    if (unifyLots) {
      return allLots.reduce((sum, lot) => {
        const lotStock = lot.stock?.reduce((s, stk) => s + (stk.quantity ?? 0), 0) ?? 0;
        return sum + lotStock;
      }, 0);
    }
    const lot = allLots.find((l) => l.lot_id === selectedLotId);
    const stock = lot?.stock?.find((s) => s.stock_id === selectedStockId);
    return stock?.quantity ?? 0;
  }, [allLots, unifyLots, selectedLotId, selectedStockId]);

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

  const handleSetPrice = (newPrice: number) => {
    setPrice(newPrice);
    setSelectedPriceId(null); // manual override clears the selected preset
  };

  const handleSetSelectedLotId = (lotId: number | null) => {
    setSelectedLotId(lotId);
    if (lotId === null) {
      setSelectedStockId(null);
      return;
    }
    const lot = allLots.find((l) => l.lot_id === lotId);
    const firstStock = lot?.stock?.[0] ?? null;
    setSelectedStockId(firstStock?.stock_id ?? null);
  };

  return {
    quantity,
    handleQuantityChange,

    sellPriceType,
    setSellPriceType,

    filteredPrices,
    selectedPriceId,
    handleSelectPrice,
    price,
    setPrice: handleSetPrice,

    lots: allLots,
    selectedLotId,
    setSelectedLotId: handleSetSelectedLotId,
    selectedStockId,

    availableStock,
    isLoading: shouldFetchInternally ? isLoading : false,
    subtotal: quantity * price,
  };
}

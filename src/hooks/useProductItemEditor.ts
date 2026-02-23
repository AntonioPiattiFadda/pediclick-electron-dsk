import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductPresentations } from "@/service/productPresentations";
import { resolveEffectivePrice } from "@/utils/prices";
import type { Price } from "@/types/prices";
import type { Lot } from "@/types/lots";

export interface UseProductItemEditorOptions {
  productId: number | null;
  productPresentationId: number | null;
  locationId: number;
  clientId?: number | null;

  // Optional data override — when provided, skips internal fetch
  prices?: Price[];
  lots?: Lot[];

  // Lot behaviour
  unifyLots?: boolean; // default: false → shows lot selector

  // Seed values (only applied on first render)
  initialQuantity?: number;
  initialPrice?: number;
}

export interface UseProductItemEditorReturn {
  // Quantity
  quantity: number;
  handleQuantityChange: (qty: number) => void; // auto-recalculates price

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
  clientId,
  prices: externalPrices,
  lots: externalLots,
  unifyLots = false,
  initialQuantity = 1,
  initialPrice,
}: UseProductItemEditorOptions): UseProductItemEditorReturn {
  const [quantity, setQuantity] = useState<number>(initialQuantity);
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

  // Apply the 4-step price resolution from PRICES.md
  const filteredPrices = useMemo(() => {
    const now = new Date();

    return allPrices.filter((p) => {
      // Step 1: Universal (location_id = null) not suppressed at this location,
      //         OR local price for this location exactly.
      if (p.location_id === null) {
        if (p.disabled_prices?.some((d) => d.location_id === locationId)) {
          return false;
        }
      } else if (p.location_id !== locationId) {
        return false;
      }

      // Step 2: Filter out expired LIMITED_OFFER prices
      if (p.logic_type === "LIMITED_OFFER" && p.valid_until) {
        if (new Date(p.valid_until) < now) return false;
      }

      // Step 3: SPECIAL prices — check client restriction
      if (p.logic_type === "SPECIAL") {
        const clients = p.enabled_prices_clients ?? [];
        if (clients.length > 0) {
          if (!clientId) return false;
          if (!clients.some((ec) => ec.client_id === clientId)) return false;
        }
      }

      return true;
    });
  }, [allPrices, locationId, clientId]);

  // Auto-select first price when available prices change (new presentation)
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

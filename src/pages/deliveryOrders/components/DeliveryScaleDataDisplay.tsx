import { MoneyInput } from "@/components/shared/MoneyInput";
import { Switch } from "@/components/ui/switch";
import { useDeliveryOrderContext } from "@/context/DeliveryOrderContext";
import { useScaleContext } from "@/context/ScaleContext";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { getDeliveryOrderItems } from "@/service";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";
import type { PriceLogicType, PriceType } from "@/types/prices";
import type { Product } from "@/types/products";
import { getLotsAndStockFromFirtsToLast } from "@/utils";
import { formatCurrency, resolveEffectivePrice } from "@/utils/prices";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../../components/ui/input-group";
import { Label } from "../../../components/ui/label";
import { RefButton } from "../../../components/ui/refButton";
import { LotSelector } from "../../inSiteOrders/components/LotSelector";
import { NotSelectedProduct } from "../../inSiteOrders/components/notSelectedProduct";
import { PricesSelector } from "../../inSiteOrders/components/PricesSelector";
import StockAvailability from "../../inSiteOrders/components/stockAvailability/StockAvailability";
import StockAvailabilityUnified from "../../inSiteOrders/components/stockAvailability/StockAvailabilityUnified";

const hasProduct = (p: Product) => Boolean(p?.product_id);

export const DeliveryScaleDataDisplay = ({ order }: { order: OrderT }) => {
  const [unifyLots, setUnifyLots] = useState(true);

  const {
    selectedProduct,
    productPresentation,
    selectedPriceId,
    setSelectedPriceId,
    sellPriceType,
    setSellPriceType,
    setEffectivePrice,
    effectivePrice,
    selectedLotId,
    setSelectedLotId,
    isCheckOutOpen,
    addItemToOrder,
  } = useDeliveryOrderContext();

  const [allowedToOverSelling] = useState(true);

  const { weightKg, setWeightKg, unitsCount, setUnitsCount } =
    useScaleContext();

  const { handleGetLocationId } = useGetLocationData();

  // Fetch order items from database
  const { data: orderItems = [] } = useQuery({
    queryKey: ["delivery-order-items", order.order_id],
    queryFn: async () => getDeliveryOrderItems(order.order_id!),
    enabled: !!order.order_id,
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });


  const selectedLot = useMemo(() => {
    if (!productPresentation?.lots) return null;

    return (
      productPresentation?.lots.find(
        (lot) => lot.lot_id === selectedLotId
      ) ?? null
    );
  }, [productPresentation?.lots, selectedLotId]);

  const selectedStock = useMemo(() => {
    if (!selectedLot?.stock) return null;

    return (
      selectedLot.stock.find(
        (stock) => stock.location_id === handleGetLocationId()
      ) ?? null
    );
  }, [selectedLot, handleGetLocationId]);

  const unifyedStock = useMemo(() => {
    if (!productPresentation?.lots) return null;

    return productPresentation.lots.reduce(
      (acc, lot) => {
        const stock = lot?.stock?.find(
          (stock) => stock.location_id === handleGetLocationId()
        );
        if (stock) {
          acc.quantity += stock?.quantity ?? 0;
          acc.reserved_for_selling_quantity +=
            stock?.reserved_for_selling_quantity ?? 0;
          acc.reserved_for_transferring_quantity +=
            stock?.reserved_for_transferring_quantity ?? 0;
        }
        return acc;
      },
      {
        quantity: 0,
        reserved_for_selling_quantity: 0,
        reserved_for_transferring_quantity: 0,
      }
    );
  }, [productPresentation, handleGetLocationId]);

  const prices = productPresentation?.prices ?? [];
  const lots = productPresentation?.lots ?? [];

  const somePriceHasLocationId = prices.some((p) => p.location_id);
  const firstFilteredPrices = somePriceHasLocationId
    ? prices.filter((p) => p.location_id === handleGetLocationId())
    : prices;
  const filteredPrices = firstFilteredPrices.filter(
    (p) => p.price_type === sellPriceType
  );

  const allocatedQty = useMemo(() => {
    if (!hasProduct(selectedProduct)) return 0;
    const pid = selectedProduct.product_id as number;
    return orderItems
      .filter(
        (oi) =>
          Number(oi.product_id) === Number(pid) && oi.lot_id === selectedLotId
      )
      .filter(
        (oi) =>
          oi.product_presentation_id ===
          productPresentation?.product_presentation_id
      )
      .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);
  }, [orderItems, selectedProduct, selectedLotId, productPresentation]);

  const remainingStock = (selectedStock?.quantity || 0) - allocatedQty;

  const allocatedQtyUnified = useMemo(() => {
    if (!hasProduct(selectedProduct)) return 0;
    const pid = selectedProduct.product_id as number;
    return orderItems
      .filter(
        (oi) =>
          Number(oi.product_id) === Number(pid) &&
          oi.product_presentation_id ===
          productPresentation?.product_presentation_id
      )
      .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);
  }, [orderItems, selectedProduct, productPresentation]);

  const totalUnifyedAvailable = useMemo(() => {
    if (!productPresentation?.lots) return 0;
    return productPresentation.lots.reduce((acc, lot) => {
      const stock = lot?.stock?.find(
        (stock) => stock.location_id === handleGetLocationId()
      );
      if (stock) {
        acc += stock?.quantity ?? 0;
      }
      return acc;
    }, 0);
  }, [productPresentation, handleGetLocationId]);

  const remainingUnifyedStock = totalUnifyedAvailable - allocatedQtyUnified;

  const selectedPrice =
    filteredPrices.find((p) => p.price_id === selectedPriceId) || null;

  const handleSelectPrice = (priceId: number) => {
    setSelectedPriceId(priceId);
  };

  const total =
    effectivePrice *
    (productPresentation?.sell_type === "WEIGHT"
      ? weightKg ?? 0
      : unitsCount ?? 0);

  const canAdd =
    hasProduct(selectedProduct) &&
    Number(effectivePrice) > 0 &&
    Number(
      productPresentation?.sell_type === "WEIGHT"
        ? weightKg
        : unitsCount
    ) > 0 &&
    (allowedToOverSelling
      ? true
      : Number(unifyLots ? remainingUnifyedStock : remainingStock) > 0) &&
    (allowedToOverSelling
      ? true
      : Number(
        productPresentation?.sell_type === "WEIGHT"
          ? weightKg
          : unitsCount
      ) <= Number(unifyLots ? remainingUnifyedStock : remainingStock));

  const handleAddItem = async () => {
    const itemsCalculated = getLotsAndStockFromFirtsToLast({
      lots: lots || [],
      product_id: selectedProduct.product_id as number,
      product_name: selectedProduct.product_name,
      product_presentation_name:
        productPresentation?.product_presentation_name || "",
      product_presentation_id:
        productPresentation?.product_presentation_id || 0,
      price_type: selectedPrice?.price_type as PriceType,
      logic_type: selectedPrice?.logic_type as PriceLogicType,
      quantity: Number(
        productPresentation?.sell_type === "WEIGHT"
          ? weightKg
          : unitsCount
      ),
      price: selectedPrice ? selectedPrice.price / (selectedPrice.qty_per_price ?? 1) : 0,
      subtotal: Number(total),
      total: Number(total),
      created_at: new Date().toISOString(),
      order_id: order.order_id as number,
      is_deleted: false,
      status: "COMPLETED",
      location_id: handleGetLocationId(),
      lot_id: unifyLots ? null : selectedLotId,
      allowOverSelling: allowedToOverSelling,
    });

    console.log("itemsCalculated:", itemsCalculated);

    // Add each calculated item to database
    for (const item of itemsCalculated) {
      const itemToAdd: Omit<OrderItem, "order_item_id"> = {
        product_id: item.product_id,
        product_name: item.product_name,
        product_presentation_id: item.product_presentation_id,
        product_presentation_name: item.product_presentation_name,
        quantity: item.quantity,
        over_sell_quantity: item.over_sell_quantity || 0,
        price: item.price,
        subtotal: item.subtotal,
        total: item.total,
        stock_id: item.stock_id,
        lot_id: item.lot_id,
        status: "PENDING",
        price_type: item.price_type,
        logic_type: item.logic_type,
        order_id: item.order_id,
        location_id: item.location_id,
        is_deleted: item.is_deleted,
        created_at: item.created_at,

      };

      await addItemToOrder(itemToAdd);
    }
  };

  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActionRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isCheckOutOpen) {
        e.preventDefault();
        if (pendingActionRef.current) {
          if (pendingTimeoutRef.current) {
            clearTimeout(pendingTimeoutRef.current);
          }
          pendingActionRef.current = false;
          pendingTimeoutRef.current = null;
          return;
        }
        pendingActionRef.current = true;

        pendingTimeoutRef.current = setTimeout(() => {
          pendingActionRef.current = false;
          pendingTimeoutRef.current = null;

          addButtonRef.current?.click();
        }, 300);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCheckOutOpen]);

  if (!order?.order_id) {
    return null;
  }

  if (!hasProduct(selectedProduct)) {
    return (
      <>
        <NotSelectedProduct />
      </>
    );
  }

  return (
    <div className="col-span-1 flex flex-col gap-2 mt-auto">
      <div className="w-full grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm text-slate-600">Resumen</label>
        </div>
        <div className=" flex flex-row gap-2 items-center ">
          <label className="text-sm text-slate-600  ml-auto">
            Tipo de venta
          </label>
          <div className="flex gap-2 items-center mt-1 ml-auto">
            <label>Mayorista</label>
            <Checkbox
              checked={sellPriceType === "MAYOR"}
              onCheckedChange={(checked) => {
                setSellPriceType(checked ? "MAYOR" : "MINOR");
              }}
            />
            <label>Minorista</label>
            <Checkbox
              checked={sellPriceType === "MINOR"}
              onCheckedChange={(checked) => {
                setSellPriceType(checked ? "MINOR" : "MAYOR");
              }}
            />
          </div>
        </div>
      </div>
      <div className="border rounded-lg p-4 shadow-sm bg-white">
        <div className="grid grid-cols-3 gap-4 text-center items-center">
          <div className="flex flex-col gap-2 justify-center">
            <div className="flex gap-2 items-center ">
              <span className="text-base font-semibold text-slate-500">
                Precio
              </span>
              {filteredPrices && filteredPrices.length === 0 ? (
                <span className="text-base font-semibold text-blue-600">
                  Sin precios
                </span>
              ) : (
                <PricesSelector
                  prices={filteredPrices}
                  onSelectPrice={(priceId) => {
                    const pricePrice =
                      filteredPrices.find((p) => p.price_id === priceId)
                        ?.price || 0;
                    setEffectivePrice(pricePrice);
                    handleSelectPrice(priceId);
                  }}
                />
              )}
            </div>

            <MoneyInput
              label=""
              value={effectivePrice || undefined}
              onChange={(value) => {
                setEffectivePrice(value ?? 0);
                setSelectedPriceId(null);
              }}
              resetKey={`${selectedProduct?.product_id}-${productPresentation?.product_presentation_id}`}
            />

            <InputGroup>
              <InputGroupInput
                type="number"
                value={
                  productPresentation?.sell_type === "WEIGHT"
                    ? weightKg
                    : unitsCount || undefined
                }
                onChange={(e) => {
                  const newValue = e.target.value;

                  const {
                    effectivePrice: calculatedPrice,
                    price_id: calculatedPriceId,
                  } = resolveEffectivePrice(
                    Number(newValue),
                    selectedPriceId,
                    filteredPrices
                  );

                  if (productPresentation?.sell_type === "WEIGHT") {
                    setWeightKg(newValue === "" ? undefined : Number(newValue));
                  } else {
                    setUnitsCount(
                      newValue === "" ? undefined : Number(newValue)
                    );
                  }

                  if (!calculatedPriceId) {
                    return;
                  }

                  setEffectivePrice(calculatedPrice);
                  setSelectedPriceId(calculatedPriceId);
                }}
                placeholder="--"
              />
              <InputGroupAddon align="inline-start">
                <InputGroupButton>{"x"}</InputGroupButton>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupButton>
                  {productPresentation?.sell_type === "WEIGHT"
                    ? "Kg"
                    : "Un"}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {/* Stock */}
          <div className="flex flex-col">
            <div className="flex gap-2 justify-center items-center h-10">
              <span className="text-base font-semibold text-transparent">
                Precio
              </span>
            </div>
            <div className="flex gap-2 justify-center items-center h-10">
              <Switch
                id="unify-lots-switch"
                checked={unifyLots}
                onCheckedChange={(checked) => setUnifyLots(checked)}
              />

              <Label>{unifyLots ? "Unificados" : " Lote:"}</Label>

              {!unifyLots && (
                <LotSelector
                  lots={lots || []}
                  onSelectLot={(lotId) => {
                    setSelectedLotId(lotId);
                  }}
                />
              )}
            </div>

            {unifyLots ? (
              <StockAvailabilityUnified
                unifyedStock={unifyedStock!}
                remainingUnifyedStock={remainingUnifyedStock}
              />
            ) : (
              <StockAvailability
                selectedStock={selectedStock!}
                remainingStock={remainingStock}
              />
            )}
          </div>

          {/* Total */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">Subtotal</span>
            <span className="text-lg font-bold text-blue-700 border rounded-lg px-3 py-2 bg-blue-50">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <RefButton
            disabled={!canAdd}
            onClick={handleAddItem}
            btnRef={addButtonRef}
          >
            {!hasProduct(selectedProduct)
              ? "Seleccioná un producto"
              : Number(remainingStock) <= 0
                ? "Sin stock disponible"
                : Number(
                  productPresentation?.sell_type === "WEIGHT"
                    ? weightKg
                    : unitsCount
                ) > Number(unifyLots ? remainingUnifyedStock : remainingStock)
                  ? "Cantidad supera el stock disponible"
                  : "Agregar al pedido"}
          </RefButton>
        </div>
      </div>
    </div>
  );
};

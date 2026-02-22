import { Switch } from "@/components/ui/switch";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/stores/store";
import {
    setSelectedPriceId,
    setSellPriceType,
    setEffectivePrice,
    setSelectedLotId,
} from "@/stores/orderSlice";
import { setAiOrderItems } from "@/stores/deliveryOrderAiSlice";
import { setWeight, setUnitsCount } from "@/stores/scaleSlice";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { OrderT } from "@/types/orders";
import { OrderItem } from "@/types/orderItems";
import type { PriceLogicType, PriceType } from "@/types/prices";
import type { Product } from "@/types/products";
import { getLotsAndStockFromFirtsToLast } from "@/utils";
import { formatCurrency, resolveEffectivePrice } from "@/utils/prices";
import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "../../../components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../../../components/ui/input-group";
import { Label } from "../../../components/ui/label";
import { RefButton } from "../../../components/ui/refButton";
import { LotSelector } from "@/components/shared/LotSelector";
import { NotSelectedProduct } from "@/components/shared/NotSelectedProduct";
import { PricesSelector } from "@/components/shared/PricesSelector";
import StockAvailability from "@/components/shared/StockAvailability";
import StockAvailabilityUnified from "@/components/shared/StockAvailabilityUnified";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { useFocusableInput } from "@/hooks/useFocus";
import { FOCUS_ORDER } from "@/constants/focusOrder";

const hasProduct = (p: Product) => Boolean(p?.product_id);

const PricingPanel = ({ order }: {
    order: OrderT;
}) => {
    const [unifyLots, setUnifyLots] = useState(true);

    const quantityShortCodeRef = useFocusableInput("quantity-shortcode", FOCUS_ORDER.QUANTITY);

    const dispatch = useDispatch<AppDispatch>();

    const selectedProduct = useSelector((state: RootState) => state.order.selectedProduct);
    const productPresentations = useSelector((state: RootState) => state.order.productPresentations);
    const productPresentation = useSelector((state: RootState) => state.order.productPresentation);
    const selectedPriceId = useSelector((state: RootState) => state.order.selectedPriceId);
    const sellPriceType = useSelector((state: RootState) => state.order.sellPriceType);
    const effectivePrice = useSelector((state: RootState) => state.order.effectivePrice);
    const selectedLotId = useSelector((state: RootState) => state.order.selectedLotId);
    const isCheckOutOpen = useSelector((state: RootState) => state.order.isCheckOutOpen);
    const weightKg = useSelector((state: RootState) => state.scale.weightKg);
    const unitsCount = useSelector((state: RootState) => state.scale.unitsCount);
    const orderItems = useSelector((state: RootState) => state.deliveryOrderAi.orderItems);

    const setOrderItems = (updater: OrderItem[] | ((prev: OrderItem[]) => OrderItem[])) => {
        const next = typeof updater === 'function' ? updater(orderItems) : updater;
        dispatch(setAiOrderItems(next));
    };

    const [allowedToOverSelling] = useState(true);

    const { handleGetLocationId } = useGetLocationData()

    const productPresentationId = productPresentation?.product_presentation_id;

    console.log("productPresentationId:", productPresentationId);

    const selectedProductPresentation = useMemo(() => {
        return productPresentations.find(pp => pp.product_presentation_id === productPresentationId) || null;
    }, [productPresentations, productPresentationId]);

    console.log("selectedProductPresentation:", selectedProductPresentation);

    const selectedLot = useMemo(() => {
        if (!selectedProductPresentation?.lots) return null;

        return (
            selectedProductPresentation?.lots.find(
                (lot) => lot.lot_id === selectedLotId
            ) ?? null
        );
    }, [selectedProductPresentation?.lots, selectedLotId]);

    console.log("selectedLot:", selectedLot);

    //FIXME aca estoy buscando por locationId asumiendo que el lot solo tienen un stock en esa location

    const selectedStock = useMemo(() => {
        if (!selectedLot?.stock) return null;

        return (
            selectedLot.stock.find(
                (stock) => stock.location_id === handleGetLocationId()
            ) ?? null
        );
    }, [selectedLot]);

    const unifyedStock = useMemo(() => {
        if (!selectedProductPresentation?.lots) return null;

        return (
            selectedProductPresentation.lots.reduce((acc, lot) => {
                const stock = lot?.stock?.find((stock) => stock.location_id === handleGetLocationId());
                console.log("stock:", stock);
                if (stock) {
                    acc.quantity += stock?.quantity ?? 0;
                    acc.reserved_for_selling_quantity += stock?.reserved_for_selling_quantity ?? 0;
                    acc.reserved_for_transferring_quantity += stock?.reserved_for_transferring_quantity ?? 0;
                }
                return acc;
            }, { quantity: 0, reserved_for_selling_quantity: 0, reserved_for_transferring_quantity: 0 })
        );
    }, [selectedProductPresentation]);

    console.log("unifyedStock:", unifyedStock);

    const prices = selectedProductPresentation?.prices ?? [];

    const lots = selectedProductPresentation?.lots ?? [];

    const somePriceHasLocationId = prices.some((p) => p.location_id);

    const firstFilteredPrices = somePriceHasLocationId ? prices.filter((p) => p.location_id === handleGetLocationId()) : prices;

    const filteredPrices = firstFilteredPrices.filter((p) => p.price_type === sellPriceType);

    console.log("selectedProductPresentation:", selectedProductPresentation);

    console.log("orderItems:", orderItems);

    const allocatedQty = useMemo(() => {
        if (!hasProduct(selectedProduct)) return 0;
        const pid = selectedProduct.product_id as number;
        return orderItems
            .filter((oi) => Number(oi.product_id) === Number(pid) && oi.lot_id === selectedLotId)
            .filter((oi) => oi.product_presentation_id === selectedProductPresentation?.product_presentation_id)
            .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);
    }, [orderItems, selectedProduct, selectedLotId, selectedProductPresentation]);

    console.log("allocatedQty:", allocatedQty);

    const remainingStock = (selectedStock?.quantity || 0) - allocatedQty;

    console.log("remainingStock:", remainingStock);


    const allocatedQtyUnified = useMemo(() => {
        if (!hasProduct(selectedProduct)) return 0;
        const pid = selectedProduct.product_id as number;
        return orderItems
            .filter((oi) => Number(oi.product_id) === Number(pid) && oi.product_presentation_id === selectedProductPresentation?.product_presentation_id)
            .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);
    }, [orderItems, selectedProduct, selectedProductPresentation]);

    console.log("allocatedQtyUnified:", allocatedQtyUnified);

    const totalUnifyedAvailable = useMemo(() => {
        if (!selectedProductPresentation?.lots) return 0;
        return selectedProductPresentation.lots.reduce((acc, lot) => {
            const stock = lot?.stock?.find((stock) => stock.location_id === handleGetLocationId());
            if (stock) {
                acc += stock?.quantity ?? 0;
            }
            return acc;
        }, 0);
    }, [selectedProductPresentation]);

    const remainingUnifyedStock = totalUnifyedAvailable - allocatedQtyUnified;

    console.log("selectedProductPresentation?.sell_type:", selectedProductPresentation?.sell_type);


    const selectedPrice = filteredPrices.find((p) => p.price_id === selectedPriceId) || null;

    const handleSelectPrice = (priceId: number) => {
        dispatch(setSelectedPriceId(priceId));
    }

    const total = effectivePrice * (selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg ?? 0 : unitsCount ?? 0);

    const canAdd =
        hasProduct(selectedProduct) &&
        Number(effectivePrice) > 0 &&
        Number(selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg : unitsCount) > 0 &&
        (allowedToOverSelling ? true : Number(unifyLots ? remainingUnifyedStock : remainingStock) > 0)
        && (allowedToOverSelling ? true : Number(selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg : unitsCount) <= Number(unifyLots ? remainingUnifyedStock : remainingStock));

    console.log("canAdd:", canAdd);
    console.log("canAdd:", selectedProduct);

    console.log("Number(quantity) > 0:", Number(selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg : unitsCount) > 0);
    console.log("effectivePrice:", effectivePrice);
    console.log("quantity:", allowedToOverSelling ? true : Number(unifyLots ? remainingUnifyedStock : remainingStock));
    console.log("canAdd:", (allowedToOverSelling ? true : Number(selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg : unitsCount) <= Number(unifyLots ? remainingUnifyedStock : remainingStock)));
    console.log("allowedToOverSelling:", allowedToOverSelling);


    const handleAddItem = () => {
        const itemsCalculated = getLotsAndStockFromFirtsToLast({
            lots: lots || [],
            product_id: selectedProduct.product_id as number,
            product_name: selectedProduct.product_name,
            product_presentation_name: selectedProductPresentation?.product_presentation_name || "",
            product_presentation_id: selectedProductPresentation?.product_presentation_id || 0,
            price_type: selectedPrice?.price_type as PriceType,
            logic_type: selectedPrice?.logic_type as PriceLogicType,
            quantity: Number(selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg : unitsCount),
            price: selectedPrice ? selectedPrice.price / (selectedPrice.qty_per_price ?? 1) : 0,
            subtotal: Number(total),
            total: Number(total),
            created_at: new Date().toISOString(),
            order_id: order.order_id as number,
            is_deleted: false,
            status: 'COMPLETED',
            location_id: handleGetLocationId(),
            lot_id: unifyLots ? null : selectedLotId,
            allowOverSelling: allowedToOverSelling
        });

        console.log("itemsCalculated:", itemsCalculated);

        setOrderItems((prev) => [...prev, ...itemsCalculated]);
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
        return null
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
                    <label className="text-sm text-slate-600  ml-auto">Tipo de venta</label>
                    <div className="flex gap-2 items-center mt-1 ml-auto">
                        <label >Mayorista</label>
                        <Checkbox checked={sellPriceType === 'MAYOR'} onCheckedChange={(checked) => {
                            dispatch(setSellPriceType(checked ? 'MAYOR' : 'MINOR'));
                        }} />
                        <label >Minorista</label>
                        <Checkbox checked={sellPriceType === 'MINOR'} onCheckedChange={(checked) => {
                            dispatch(setSellPriceType(checked ? 'MINOR' : 'MAYOR'));
                        }} />
                    </div>
                </div>

            </div>
            <div className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="grid grid-cols-3 gap-4 text-center items-center">
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="flex gap-2 items-center ">
                            <span className="text-base font-semibold text-slate-500">Precio</span>
                            {filteredPrices && filteredPrices.length === 0 ? (
                                <span className="text-base font-semibold text-blue-600">
                                    Sin precios
                                </span>
                            ) : (
                                <PricesSelector
                                    prices={filteredPrices}
                                    selectedPriceId={selectedPriceId}
                                    onSelectPrice={(priceId) => {
                                        const pricePrice = filteredPrices.find(p => p.price_id === priceId)?.price || 0;
                                        dispatch(setEffectivePrice(pricePrice));
                                        handleSelectPrice(priceId)
                                    }} />
                            )}
                        </div>

                        <MoneyInput
                            label=""
                            value={effectivePrice || undefined}
                            onChange={(value) => {
                                console.log("Manual price change:", value);
                                dispatch(setEffectivePrice(value ?? 0));
                                dispatch(setSelectedPriceId(null));
                            }}
                            resetKey={`${selectedProduct?.product_id}-${productPresentation?.product_presentation_id}`}
                        />

                        <InputGroup>
                            <InputGroupInput
                                ref={quantityShortCodeRef}
                                type="number"
                                value={selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg : unitsCount || undefined}
                                onChange={(e) => {
                                    const newValue = e.target.value;

                                    const {
                                        effectivePrice: calculatedPrice,
                                        price_id: calculatedPriceId,
                                    } = resolveEffectivePrice(Number(newValue), selectedPriceId, filteredPrices);

                                    if (selectedProductPresentation?.sell_type === "WEIGHT") {
                                        dispatch(setWeight(newValue === '' ? undefined : Number(newValue)));
                                    } else {
                                        dispatch(setUnitsCount(newValue === '' ? undefined : Number(newValue)));
                                    }

                                    if (!calculatedPriceId) {
                                        return;
                                    }

                                    dispatch(setEffectivePrice(calculatedPrice));
                                    dispatch(setSelectedPriceId(calculatedPriceId));
                                }}
                                placeholder="--" />
                            <InputGroupAddon align="inline-start">
                                <InputGroupButton>{'x'}</InputGroupButton>
                            </InputGroupAddon>
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton>{selectedProductPresentation?.sell_type === "WEIGHT" ? 'Kg' : 'Un'}</InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>

                    {/* Stock */}
                    <div className="flex flex-col">
                        <div className="flex gap-2 justify-center items-center h-10">
                            <span className="text-base font-semibold text-transparent">Precio</span>
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
                                    selectedLotId={selectedLotId}
                                    onSelectLot={(lotId) => {
                                        dispatch(setSelectedLotId(lotId));
                                    }}
                                />
                            )}
                        </div>

                        {unifyLots ?
                            <StockAvailabilityUnified unifyedStock={unifyedStock!} remainingUnifyedStock={remainingUnifyedStock} /> :
                            <StockAvailability selectedStock={selectedStock!} remainingStock={remainingStock} />}

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
                                : Number(selectedProductPresentation?.sell_type === "WEIGHT" ? weightKg : unitsCount) > Number(unifyLots ? remainingUnifyedStock : remainingStock)
                                    ? "Cantidad supera el stock disponible"
                                    : "Agregar al pedido"}
                    </RefButton>
                </div>
            </div>

        </div >);
};

export default PricingPanel;

import { Switch } from "@/components/ui/switch";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/stores/store";
import { setWeight, setUnitsCount } from "@/stores/scaleSlice";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { useProductItemEditor } from "@/hooks/useProductItemEditor";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";
import type { MovementStatus } from "@/types";
import type { PriceLogicType } from "@/types/prices";
import type { Product } from "@/types/products";
import type { ProductPresentation } from "@/types/productPresentation";
import type { Lot } from "@/types/lots";
import { getLotsAndStockFromFirtsToLast } from "@/utils";
import { formatCurrency } from "@/utils/prices";
import { useEffect, useMemo, useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RefButton } from "@/components/ui/refButton";
import { NotSelectedProduct } from "@/components/shared/NotSelectedProduct";
import { PricesSelector } from "@/components/shared/PricesSelector";
import StockAvailabilityUnified from "@/components/shared/StockAvailabilityUnified";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { LotQtyTable } from "@/components/shared/LotQtyTable";
import { useFocusableInput } from "@/hooks/useFocus";
import { FOCUS_ORDER } from "@/constants/focusOrder";

const hasProduct = (p: Product) => Boolean(p?.product_id);

const PricingPanel = ({
    order,
    selectedProduct,
    productPresentation,
    isCheckOutOpen,
    orderItems,
    onAddItems,
}: {
    order: OrderT;
    selectedProduct: Product;
    productPresentation: ProductPresentation;
    isCheckOutOpen: boolean;
    orderItems: OrderItem[];
    onAddItems: (items: OrderItem[]) => void | Promise<void>;
}) => {
    const quantityShortCodeRef = useFocusableInput("quantity-shortcode", FOCUS_ORDER.QUANTITY);

    const [unifyLots, setUnifyLots] = useState(true);
    const [lotQtyMap, setLotQtyMap] = useState<Record<number, number>>({});
    const [allowedToOverSelling] = useState(true);

    const weightKg = useSelector((state: RootState) => state.scale.weightKg);
    const unitsCount = useSelector((state: RootState) => state.scale.unitsCount);
    const clientPaymentModalOpen = useSelector((state: RootState) => state.modals.clientPaymentModalOpen);
    const dispatch = useDispatch();
    const { handleGetLocationId } = useGetLocationData();
    const locationId = handleGetLocationId();

    const isWeight = productPresentation.sell_unit === "BY_WEIGHT";

    const editor = useProductItemEditor({
        productId: selectedProduct.product_id ?? null,
        productPresentationId: productPresentation.product_presentation_id ?? null,
        locationId,
        clientId: order.client_id,
        prices: productPresentation.prices,
        lots: productPresentation.lots as Lot[] | undefined,
        unifyLots,
    });

    // Reset lot qty map when presentation changes or mode switches
    useEffect(() => {
        setLotQtyMap({});
    }, [productPresentation.product_presentation_id, unifyLots]);

    // ── Unified mode ────────────────────────────────────────────────────────

    const unifyedStock = useMemo(() => {
        if (!editor.lots.length) return null;
        return editor.lots.reduce(
            (acc, lot) => {
                const stock = lot?.stock?.find((s) => s.location_id === locationId);
                if (stock) {
                    acc.quantity += stock.quantity ?? 0;
                    acc.reserved_for_selling_quantity += stock.reserved_for_selling_quantity ?? 0;
                    acc.reserved_for_transferring_quantity += stock.reserved_for_transferring_quantity ?? 0;
                }
                return acc;
            },
            { quantity: 0, reserved_for_selling_quantity: 0, reserved_for_transferring_quantity: 0 }
        );
    }, [editor.lots, locationId]);

    const allocatedQtyUnified = useMemo(() => {
        if (!hasProduct(selectedProduct)) return 0;
        const pid = selectedProduct.product_id as number;
        return orderItems
            .filter((oi) =>
                Number(oi.product_id) === Number(pid) &&
                oi.product_presentation_id === productPresentation.product_presentation_id
            )
            .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);
    }, [orderItems, selectedProduct, productPresentation.product_presentation_id]);

    const totalUnifyedAvailable = useMemo(() => {
        return editor.lots.reduce((acc, lot) => {
            const stock = lot?.stock?.find((s) => s.location_id === locationId);
            if (stock) acc += stock.quantity ?? 0;
            return acc;
        }, 0);
    }, [editor.lots, locationId]);

    const remainingUnifyedStock = totalUnifyedAvailable - allocatedQtyUnified;

    const unifiedQty = isWeight ? weightKg ?? 0 : unitsCount ?? 0;

    // ── Per-lot mode ─────────────────────────────────────────────────────────

    const totalSelectedQty = useMemo(
        () => Object.values(lotQtyMap).reduce((s, v) => s + v, 0),
        [lotQtyMap]
    );

    // ── Shared ───────────────────────────────────────────────────────────────

    const selectedPrice = editor.filteredPrices.find((p) => p.price_id === editor.selectedPriceId) || null;

    const qty = unifyLots ? unifiedQty : totalSelectedQty;
    const total = editor.price * qty;

    const canAdd = unifyLots
        ? hasProduct(selectedProduct) &&
          Number(editor.price) > 0 &&
          Number(unifiedQty) > 0 &&
          (allowedToOverSelling || remainingUnifyedStock > 0) &&
          (allowedToOverSelling || unifiedQty <= remainingUnifyedStock)
        : hasProduct(selectedProduct) &&
          Number(editor.price) > 0 &&
          totalSelectedQty > 0;

    // ── Add handlers ─────────────────────────────────────────────────────────

    const handleAddItemUnified = async () => {
        const itemsCalculated = getLotsAndStockFromFirtsToLast({
            lots: editor.lots || [],
            product_id: selectedProduct.product_id as number,
            product_name: selectedProduct.product_name,
            product_presentation_name: productPresentation.product_presentation_name || "",
            product_presentation_id: productPresentation.product_presentation_id || 0,
            logic_type: selectedPrice?.logic_type as PriceLogicType,
            quantity: Number(unifiedQty),
            price: editor.price,
            subtotal: Number(total),
            total: Number(total),
            created_at: new Date().toISOString(),
            order_id: order.order_id as number,
            is_deleted: false,
            status: "COMPLETED",
            location_id: locationId,
            lot_id: null,
            allowOverSelling: allowedToOverSelling,
        });
        await onAddItems(itemsCalculated);
    };

    const handleAddItemsFromLotMap = async () => {
        const items: OrderItem[] = Object.entries(lotQtyMap)
            .filter(([, qty]) => qty > 0)
            .map(([lotIdStr, lotQty]) => {
                const lotId = Number(lotIdStr);
                const lot = editor.lots.find((l) => l.lot_id === lotId);
                const stock = lot?.stock?.find((s) => s.location_id === locationId);
                const subtotal = editor.price * lotQty;
                return {
                    lot_id: lotId,
                    stock_id: stock?.stock_id ?? null,
                    location_id: locationId,
                    product_id: selectedProduct.product_id as number,
                    product_name: selectedProduct.product_name,
                    product_presentation_name: productPresentation.product_presentation_name || "",
                    product_presentation_id: productPresentation.product_presentation_id || 0,
                    price: editor.price,
                    logic_type: selectedPrice?.logic_type as PriceLogicType,
                    quantity: lotQty,
                    over_sell_quantity: 0,
                    subtotal,
                    total: subtotal,
                    created_at: new Date().toISOString(),
                    order_id: order.order_id as number,
                    is_deleted: false,
                    status: "COMPLETED" as MovementStatus,
                };
            });
        await onAddItems(items);
        setLotQtyMap({});
    };

    const handleAddItem = unifyLots ? handleAddItemUnified : handleAddItemsFromLotMap;

    // ── Enter key ─────────────────────────────────────────────────────────────

    const addButtonRef = useRef<HTMLButtonElement | null>(null);
    const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingActionRef = useRef(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !isCheckOutOpen && !clientPaymentModalOpen) {
                e.preventDefault();
                if (pendingActionRef.current) {
                    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
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
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCheckOutOpen, clientPaymentModalOpen]);

    if (!order?.order_id) return null;

    if (!hasProduct(selectedProduct)) {
        return <NotSelectedProduct />;
    }

    return (
        <div className="col-span-1 flex flex-col gap-2 mt-auto">
            <div className="border rounded-lg p-4 shadow-sm bg-white">

                {/* ── Top row: price / switch / total ── */}
                <div className="grid grid-cols-3 gap-4 text-center items-center">

                    {/* Price column */}
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="flex gap-2 items-center">
                            <span className="text-base font-semibold text-slate-500">Precio</span>
                            {editor.filteredPrices.length === 0 ? (
                                <span className="text-base font-semibold text-blue-600">Sin precios</span>
                            ) : (
                                <PricesSelector
                                    prices={editor.filteredPrices}
                                    selectedPriceId={editor.selectedPriceId}
                                    onSelectPrice={editor.handleSelectPrice}
                                    isWeight={isWeight}
                                />
                            )}
                        </div>

                        <MoneyInput
                            label=""
                            value={editor.price || undefined}
                            onChange={(value) => editor.setPrice(value ?? 0)}
                            resetKey={`${selectedProduct?.product_id}-${productPresentation?.product_presentation_id}`}
                        />

                        {/* Qty input only shown in unified mode */}
                        {unifyLots && (
                            <InputGroup>
                                <input
                                    ref={quantityShortCodeRef}
                                    type="number"
                                    value={isWeight ? weightKg : unitsCount || undefined}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        const numValue = newValue === "" ? undefined : Number(newValue);
                                        if (isWeight) {
                                            dispatch(setWeight(numValue));
                                        } else {
                                            dispatch(setUnitsCount(numValue));
                                        }
                                        if (numValue !== undefined) {
                                            editor.handleQuantityChange(numValue);
                                        }
                                    }}
                                    placeholder="--"
                                    className="border-none focus:ring-0 outline-none"
                                />
                                <InputGroupAddon align="inline-start">
                                    <InputGroupButton>×</InputGroupButton>
                                </InputGroupAddon>
                                <InputGroupAddon align="inline-end">
                                    <InputGroupButton>
                                        {isWeight ? "Kg" : "Un"}
                                    </InputGroupButton>
                                </InputGroupAddon>
                            </InputGroup>
                        )}
                    </div>

                    {/* Mode switch column */}
                    <div className="flex flex-col">
                        <div className="flex gap-2 justify-center items-center h-10">
                            <span className="text-base font-semibold text-transparent">.</span>
                        </div>
                        <div className="flex gap-2 justify-center items-center h-10">
                            <Switch
                                id="unify-lots-switch"
                                checked={unifyLots}
                                onCheckedChange={(checked) => setUnifyLots(checked)}
                            />
                            <Label>{unifyLots ? "Unificados" : "Por lote"}</Label>
                        </div>

                        {unifyLots && (
                            <StockAvailabilityUnified
                                unifyedStock={unifyedStock!}
                                remainingUnifyedStock={remainingUnifyedStock}
                            />
                        )}
                    </div>

                    {/* Total column */}
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500">Subtotal</span>
                        <span className="text-lg font-bold text-blue-700 border rounded-lg px-3 py-2 bg-blue-50">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>

                {/* ── Per-lot table ── */}
                {!unifyLots && (
                    <div className="mt-3 border-t pt-3">
                        <LotQtyTable
                            lots={editor.lots}
                            orderItems={orderItems}
                            locationId={locationId}
                            lotQtyMap={lotQtyMap}
                            onChangeLotQty={(lotId, qty) =>
                                setLotQtyMap((prev) => ({ ...prev, [lotId]: qty }))
                            }
                            isWeight={isWeight}
                        />
                    </div>
                )}

                <div className="flex justify-end mt-2">
                    <RefButton
                        disabled={!canAdd}
                        onClick={handleAddItem}
                        btnRef={addButtonRef}
                    >
                        {unifyLots
                            ? unifiedQty > remainingUnifyedStock
                                ? "Cantidad supera el stock disponible"
                                : "Agregar al pedido"
                            : totalSelectedQty === 0
                                ? "Ingresá cantidades por lote"
                                : "Agregar al pedido"}
                    </RefButton>
                </div>
            </div>
        </div>
    );
};

export default PricingPanel;

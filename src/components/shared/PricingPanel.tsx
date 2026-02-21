import { Switch } from "@/components/ui/switch";
import { useScaleContext } from "@/context/ScaleContext";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { useProductItemEditor } from "@/hooks/useProductItemEditor";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";
import type { PriceLogicType, PriceType } from "@/types/prices";
import type { Product } from "@/types/products";
import type { ProductPresentation } from "@/types/productPresentation";
import type { Lot } from "@/types/lots";
import { getLotsAndStockFromFirtsToLast } from "@/utils";
import { formatCurrency } from "@/utils/prices";
import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RefButton } from "@/components/ui/refButton";
import { LotSelector } from "@/components/shared/LotSelector";
import { NotSelectedProduct } from "@/components/shared/NotSelectedProduct";
import { PricesSelector } from "@/components/shared/PricesSelector";
import StockAvailability from "@/components/shared/StockAvailability";
import StockAvailabilityUnified from "@/components/shared/StockAvailabilityUnified";
import { MoneyInput } from "@/components/shared/MoneyInput";

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
    const [unifyLots, setUnifyLots] = useState(true);

    const [allowedToOverSelling] = useState(true);

    const { weightKg, setWeightKg, unitsCount, setUnitsCount } = useScaleContext();
    const { handleGetLocationId } = useGetLocationData();
    const locationId = handleGetLocationId();

    const editor = useProductItemEditor({
        productId: selectedProduct.product_id ?? null,
        productPresentationId: productPresentation.product_presentation_id ?? null,
        locationId,
        prices: productPresentation.prices,
        lots: productPresentation.lots as Lot[] | undefined,
        unifyLots,
    });

    // Selected lot object (for per-lot stock display)
    const selectedLot = useMemo(() => {
        return editor.lots.find((l) => l.lot_id === editor.selectedLotId) ?? null;
    }, [editor.lots, editor.selectedLotId]);

    // Selected stock object (found by location)
    const selectedStock = useMemo(() => {
        if (!selectedLot?.stock) return null;
        return selectedLot.stock.find((s) => s.location_id === locationId) ?? null;
    }, [selectedLot, locationId]);

    // Unified stock totals across all lots for this location
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

    // Allocated quantity already in the cart for the selected lot
    const allocatedQty = useMemo(() => {
        if (!hasProduct(selectedProduct)) return 0;
        const pid = selectedProduct.product_id as number;
        return orderItems
            .filter((oi) =>
                Number(oi.product_id) === Number(pid) &&
                oi.lot_id === editor.selectedLotId &&
                oi.product_presentation_id === productPresentation.product_presentation_id
            )
            .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);
    }, [orderItems, selectedProduct, editor.selectedLotId, productPresentation.product_presentation_id]);

    const remainingStock = (selectedStock?.quantity || 0) - allocatedQty;

    // Allocated quantity across all lots for this presentation
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

    const selectedPrice = editor.filteredPrices.find((p) => p.price_id === editor.selectedPriceId) || null;

    const qty = productPresentation.sell_type === "WEIGHT" ? weightKg ?? 0 : unitsCount ?? 0;
    const total = editor.price * qty;

    const canAdd =
        hasProduct(selectedProduct) &&
        Number(editor.price) > 0 &&
        Number(qty) > 0 &&
        (allowedToOverSelling ? true : Number(unifyLots ? remainingUnifyedStock : remainingStock) > 0) &&
        (allowedToOverSelling ? true : Number(qty) <= Number(unifyLots ? remainingUnifyedStock : remainingStock));

    const handleAddItem = async () => {
        const itemsCalculated = getLotsAndStockFromFirtsToLast({
            lots: editor.lots || [],
            product_id: selectedProduct.product_id as number,
            product_name: selectedProduct.product_name,
            product_presentation_name: productPresentation.product_presentation_name || "",
            product_presentation_id: productPresentation.product_presentation_id || 0,
            price_type: selectedPrice?.price_type as PriceType,
            logic_type: selectedPrice?.logic_type as PriceLogicType,
            quantity: Number(qty),
            price: editor.price,
            subtotal: Number(total),
            total: Number(total),
            created_at: new Date().toISOString(),
            order_id: order.order_id as number,
            is_deleted: false,
            status: 'COMPLETED',
            location_id: locationId,
            lot_id: unifyLots ? null : editor.selectedLotId,
            allowOverSelling: allowedToOverSelling,
        });

        await onAddItems(itemsCalculated);
    };

    const addButtonRef = useRef<HTMLButtonElement | null>(null);
    const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingActionRef = useRef(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !isCheckOutOpen) {
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
    }, [isCheckOutOpen]);

    if (!order?.order_id) return null;

    if (!hasProduct(selectedProduct)) {
        return <NotSelectedProduct />;
    }

    return (
        <div className="col-span-1 flex flex-col gap-2 mt-auto">
            <div className="w-full grid grid-cols-2 gap-2">
                <div>
                    <label className="text-sm text-slate-600">Resumen</label>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <label className="text-sm text-slate-600 ml-auto">Tipo de venta</label>
                    <div className="flex gap-2 items-center mt-1 ml-auto">
                        <label>Mayorista</label>
                        <Checkbox
                            checked={editor.sellPriceType === 'MAYOR'}
                            onCheckedChange={(checked) => editor.setSellPriceType(checked ? 'MAYOR' : 'MINOR')}
                        />
                        <label>Minorista</label>
                        <Checkbox
                            checked={editor.sellPriceType === 'MINOR'}
                            onCheckedChange={(checked) => editor.setSellPriceType(checked ? 'MINOR' : 'MAYOR')}
                        />
                    </div>
                </div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm bg-white">
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
                                />
                            )}
                        </div>

                        <MoneyInput
                            label=""
                            value={editor.price || undefined}
                            onChange={(value) => editor.setPrice(value ?? 0)}
                            resetKey={`${selectedProduct?.product_id}-${productPresentation?.product_presentation_id}`}
                        />

                        <InputGroup>
                            <InputGroupInput
                                type="number"
                                value={productPresentation.sell_type === "WEIGHT" ? weightKg : unitsCount || undefined}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    const numValue = newValue === '' ? undefined : Number(newValue);

                                    if (productPresentation.sell_type === "WEIGHT") {
                                        setWeightKg(numValue);
                                    } else {
                                        setUnitsCount(numValue);
                                    }

                                    if (numValue !== undefined) {
                                        editor.handleQuantityChange(numValue);
                                    }
                                }}
                                placeholder="--"
                            />
                            <InputGroupAddon align="inline-start">
                                <InputGroupButton>{'x'}</InputGroupButton>
                            </InputGroupAddon>
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton>
                                    {productPresentation.sell_type === "WEIGHT" ? 'Kg' : 'Un'}
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>

                    {/* Stock column */}
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
                            <Label>{unifyLots ? "Unificados" : "Lote:"}</Label>
                            {!unifyLots && (
                                <LotSelector
                                    lots={editor.lots}
                                    selectedLotId={editor.selectedLotId}
                                    onSelectLot={editor.setSelectedLotId}
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

                    {/* Total column */}
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
                                : Number(qty) > Number(unifyLots ? remainingUnifyedStock : remainingStock)
                                    ? "Cantidad supera el stock disponible"
                                    : "Agregar al pedido"}
                    </RefButton>
                </div>
            </div>
        </div>
    );
};

export default PricingPanel;

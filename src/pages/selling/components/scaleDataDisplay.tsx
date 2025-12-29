import { useOrderContext } from "@/context/OrderContext";
import { useScaleContext } from "@/context/ScaleContext";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import type { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";
import type { PriceLogicType, PriceType } from "@/types/prices";
import type { Product } from "@/types/products";
import { resolveEffectivePrice } from "@/utils/prices";
import { useEffect, useMemo, useRef } from "react";
import { Checkbox } from "../../../components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../../../components/ui/input-group";
import { Label } from "../../../components/ui/label";
import { RefButton } from "../../../components/ui/refButton";
import { LotSelector } from "./LotSelector";
import { NotSelectedProduct } from "./notSelectedProduct";
import { PricesSelector } from "./PricesSelector";
import { StockData } from "./stockData";
// TODO PREGUNTAR AL ERIC SI EN ALGUNA SITUACION SE TIENEN QUE ELEGIR LOS PRECIOS DE DESCUENTO MANUALMENTE
// TODO O SI SIEMPRE SE ELIGEN AUTOMATICAMENTE SEGUN LA CANTIDAD
// TODO LOS PRECIOS DE LIMITED_OFFER TMB ES POR CANTIDAD?

const hasProduct = (p: Product) => Boolean(p?.product_id);

const ScaleDataDisplay = ({ order }: {
    order: OrderT;
}) => {
    const {
        setOrderItems,
        orderItems,

        selectedProduct,

        productPresentations,

        productPresentation,

        selectedPriceId,
        setSelectedPriceId,

        sellPriceType,
        setSellPriceType,

        setEffectivePrice,
        effectivePrice,

        selectedLotId,
        setSelectedLotId,

        isCheckOutOpen

    } = useOrderContext();

    console.log("ScaleDataDisplay - selectedPriceId:", productPresentation);

    const { weightKg, unitsCount, setUnitsCount, } = useScaleContext();

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


    const prices = selectedProductPresentation?.prices ?? [];


    const lots = selectedProductPresentation?.lots ?? [];


    const somePriceHasLocationId = prices.some((p) => p.location_id);



    const firstFilteredPrices = somePriceHasLocationId ? prices.filter((p) => p.location_id === handleGetLocationId()) : prices;

    const filteredPrices = firstFilteredPrices.filter((p) => p.price_type === sellPriceType);


    const measurementMode = hasProduct(selectedProduct)
        ? selectedProduct.sell_measurement_mode
        : "QUANTITY";

    const allocatedQty = useMemo(() => {
        if (!hasProduct(selectedProduct)) return 0;
        const pid = selectedProduct.product_id as number;
        return orderItems
            .filter((oi) => Number(oi.product_id) === Number(pid) && oi.lot_id === selectedLotId)
            .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);
    }, [orderItems, selectedProduct, selectedLotId]);

    const remainingStock = useMemo(() => Math.max(0, Number((selectedStock?.quantity ?? 0) - (selectedStock?.reserved_for_transferring_quantity ?? 0) - (selectedStock?.reserved_for_selling_quantity ?? 0)) - Number(allocatedQty)), [selectedStock, allocatedQty]);

    const quantity = measurementMode === "WEIGHT" ? weightKg : unitsCount;

    const selectedPrice = filteredPrices.find((p) => p.price_id === selectedPriceId) || null;

    const handleSelectPrice = (priceId: number) => {
        setSelectedPriceId(priceId);
    }

    // TODO Esta funcion me tiene que devolver un selectedPrice porque necesito sus datos
    const total = effectivePrice * quantity;
    // Try to resolve the price_id based on the selected unit price (if coming from an existing lot price)

    const canAdd =
        hasProduct(selectedProduct) &&
        Number(effectivePrice) > 0 &&
        Number(quantity) > 0 &&
        Number(remainingStock) > 0 &&
        Number(quantity) <= Number(remainingStock);

    const handleAddItem = () => {

        if (!hasProduct(selectedProduct)) return;
        if (!(Number(quantity) > 0)) {
            window.alert("La cantidad debe ser mayor a 0.");
            return;
        }
        // For now, pick the first lot if present (optional for purchase orders)
        // const candidateLotId =
        //     (selectedProduct.lots?.[0]?.lot_id as number | undefined) ?? undefined;

        const item: OrderItem = {
            product_id: selectedProduct.product_id as number,
            product_presentation_id: productPresentation.product_presentation_id as number,
            product_presentation_name: productPresentation.product_presentation_name as string,
            product_name: selectedProduct.product_name,
            stock_id: selectedStock?.stock_id as number,
            price_type: selectedPrice?.price_type as PriceType,
            logic_type: selectedPrice?.logic_type as PriceLogicType,
            quantity: Number(quantity),
            price: selectedPrice ? selectedPrice.price / (selectedPrice.qty_per_price ?? 1) : 0,
            subtotal: Number(total),
            total: Number(total),
            created_at: new Date().toISOString(),
            order_id: order.order_id as number,
            is_deleted: false,
            lot_id: selectedLotId as number,
            status: 'COMPLETED',
            location_id: handleGetLocationId(),
        };
        // Push new item to order
        setOrderItems((prev) => [...prev, item]);
    };

    const addButtonRef = useRef<HTMLButtonElement | null>(null);
    const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingActionRef = useRef(false);

    useEffect(() => {

        const handleKeyDown = (e: KeyboardEvent) => {

            if (e.key === "Enter" && !isCheckOutOpen) {

                e.preventDefault();
                // Si ya hay una acción pendiente → segundo Enter = CANCELA
                if (pendingActionRef.current) {
                    if (pendingTimeoutRef.current) {
                        clearTimeout(pendingTimeoutRef.current);
                    }

                    pendingActionRef.current = false;
                    pendingTimeoutRef.current = null;

                    return;
                }

                // Primer Enter → queda pendiente
                pendingActionRef.current = true;

                pendingTimeoutRef.current = setTimeout(() => {
                    pendingActionRef.current = false;
                    pendingTimeoutRef.current = null;


                    addButtonRef.current?.click();
                }, 300); // ventana de cancelación
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
                            setSellPriceType(checked ? 'MAYOR' : 'MINOR');
                        }} />
                        <label >Minorista</label>
                        <Checkbox checked={sellPriceType === 'MINOR'} onCheckedChange={(checked) => {
                            setSellPriceType(checked ? 'MINOR' : 'MAYOR');
                        }} />
                    </div>
                </div>

            </div>
            <div className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="grid grid-cols-3 gap-4 text-center items-center">
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="flex gap-2 justify-center items-center h-10">
                            <span className="text-base font-semibold text-slate-500">Precio</span>
                            {filteredPrices && filteredPrices.length === 0 ? (
                                <span className="text-base font-semibold text-blue-600">
                                    Sin precios
                                </span>
                            ) : (
                                <PricesSelector
                                    prices={filteredPrices}
                                    onSelectPrice={(priceId) => {
                                        const pricePrice = filteredPrices.find(p => p.price_id === priceId)?.price || 0;
                                        setEffectivePrice(pricePrice);
                                        handleSelectPrice(priceId)
                                    }} />
                            )}
                        </div>
                        <InputGroup>
                            <InputGroupInput
                                type="number"
                                value={effectivePrice || undefined}
                                onChange={(e) => {
                                    const numberValue = Number(e.target.value);
                                    setEffectivePrice(numberValue)
                                    setSelectedPriceId(null);
                                }}
                                placeholder="--" />
                            {/* <InputGroupAddon>
                            <SearchIcon />
                            </InputGroupAddon> */}
                            <InputGroupAddon align="inline-start">
                                <InputGroupButton>{'$'}</InputGroupButton>
                            </InputGroupAddon>

                        </InputGroup>
                        <InputGroup>
                            <InputGroupInput
                                type="number"
                                value={quantity || undefined}
                                onChange={(e) => {
                                    const numberValue = Number(e.target.value);
                                    setUnitsCount(numberValue)
                                    console.log("quantity changed to:", numberValue);
                                    const {
                                        effectivePrice: calculatedPrice,
                                        price_id: calculatedPriceId,
                                    } = resolveEffectivePrice(numberValue, selectedPriceId, filteredPrices);

                                    setEffectivePrice(calculatedPrice);
                                    setSelectedPriceId(calculatedPriceId);
                                }}
                                placeholder="--" />
                            {/* <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon> */}
                            <InputGroupAddon align="inline-start">
                                <InputGroupButton>{'x'}</InputGroupButton>
                            </InputGroupAddon>
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton>{'Kg/Un'}</InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>

                    {/* Stock */}
                    <div className="flex flex-col">
                        <div className="flex gap-2 justify-center items-center h-10">
                            <span className="text-base font-semibold text-transparent">Precio</span>
                            {/* {filteredPrices && filteredPrices.length === 0 ? (
                                <span className="text-base font-semibold text-blue-600">
                                Sin precios
                                </span>
                                ) : (
                                    <PricesSelector
                                    prices={filteredPrices}
                                    onSelectPrice={(priceId) => handleSelectPrice(priceId)} />
                                    )} */}
                        </div>
                        <div className="flex gap-2 justify-center items-center h-10">
                            <Label>Lote:</Label>
                            {lots.length > 0 ? (
                                <LotSelector
                                    lots={lots || []}
                                    onSelectLot={(lotId) => {
                                        setSelectedLotId(lotId);
                                    }}
                                />
                            ) : (
                                <span className="text-base font-semibold text-blue-600">Sin lotes</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 mt-1">

                            <div className="flex gap-1 items-center justify-center">
                                <span className="text-xs text-slate-500">Stock disponible</span>
                                <StockData stock={selectedStock} />
                            </div>
                            <span
                                className={`text-base font-semibold ${remainingStock > 0 ? "text-green-600" : "text-amber-600"
                                    }`}
                            >
                                {Number(remainingStock)}
                            </span>

                        </div>

                    </div>

                    {/* Total */}
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500">Subtotal</span>
                        <span className="text-lg font-bold text-blue-700 border rounded-lg px-3 py-2 bg-blue-50">
                            ${Number(total).toFixed(2)}
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
                                : Number(quantity) > Number(remainingStock)
                                    ? "Cantidad supera el stock disponible"
                                    : "Agregar al pedido"}
                    </RefButton>
                </div>
            </div>

        </div >);
};

export default ScaleDataDisplay;

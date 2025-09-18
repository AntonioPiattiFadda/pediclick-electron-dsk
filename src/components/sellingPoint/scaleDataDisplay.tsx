import { useEffect, useMemo } from "react";
import { useOrderContext } from "@/context/OrderContext";
import { useScaleContext } from "@/context/ScaleContext";
import type { Product } from "@/types/products";
import type { Price } from "@/types/prices";
import type { OrderItem } from "@/types/orderItems";
import { Button } from "../ui/button";

const hasProduct = (p: Product) => Boolean(p?.product_id);

const ScaleDataDisplay = () => {
    const { selectedProduct, selectedPrice, setSelectedPrice, setOrderItems } = useOrderContext();
    const { weightKg, setWeightKg, unitsCount, setUnitsCount } = useScaleContext();
    console.log(selectedProduct);
    const measurementMode = hasProduct(selectedProduct)
        ? selectedProduct.sell_measurement_mode
        : "QUANTITY";

    const priceOptions = useMemo<Price[]>(() => {
        if (!hasProduct(selectedProduct)) return [];
        // Lots coming from backend include prices, but Lot type doesn't declare it. Cast with a helper shape.
        const lotsWithMaybePrices = (selectedProduct.lots ?? []) as unknown as Array<{ prices?: Price[] }>;
        const flattened = lotsWithMaybePrices.flatMap((l) => l?.prices ?? []);
        // Keep only active prices and sort by price_number asc
        return flattened
            .filter((p) => p && (p.is_active ?? true))
            .sort((a, b) => (a.price_number ?? 0) - (b.price_number ?? 0));
    }, [selectedProduct]);

    // Set a default selected price when product/prices change
    useEffect(() => {
        if (priceOptions.length === 0) {
            setSelectedPrice(0);
            return;
        }
        const stillMatches = priceOptions.some((p) => p.unit_price === selectedPrice);
        if (!stillMatches) {
            setSelectedPrice(priceOptions[0].unit_price);
        }
    }, [priceOptions, setSelectedPrice, selectedPrice]);

    const quantity = measurementMode === "WEIGHT" ? weightKg : unitsCount;
    const total = (Number(selectedPrice) || 0) * (Number(quantity) || 0);

    // Try to resolve the price_id based on the selected unit price (if coming from an existing lot price)
    const selectedPriceId = priceOptions.find((p) => p.unit_price === selectedPrice)?.price_id;

    const canAdd =
        hasProduct(selectedProduct) &&
        Number(selectedPrice) > 0 &&
        Number(quantity) > 0;

    const handleAddItem = () => {
        if (!hasProduct(selectedProduct)) return;

        if (!(Number(selectedPrice) > 0)) {
            window.alert("Seleccioná un precio antes de agregar.");
            return;
        }
        if (!(Number(quantity) > 0)) {
            window.alert("La cantidad debe ser mayor a 0.");
            return;
        }

        // For now, pick the first lot if present (optional for purchase orders)
        const candidateLotId =
            (selectedProduct.lots?.[0]?.lot_id as number | undefined) ?? undefined;

        const item: OrderItem = {
            product_id: selectedProduct.product_id as number,
            lot_id: candidateLotId,
            product_name: selectedProduct.product_name,
            price_id: selectedPriceId,
            quantity: Number(quantity),
            unit_price: Number(selectedPrice),
            subtotal: Number(total),
            total_price: Number(total),
            created_at: new Date().toISOString(),
        };

        // Push new item to order
        setOrderItems((prev) => [...prev, item]);
    };

    if (!hasProduct(selectedProduct)) {
        return (
            <div className="p-4 border rounded-md">
                Seleccioná un producto para ver datos de balanza y precios.
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedProduct.product_name}</h3>
                <span className="text-xs px-2 py-1 rounded bg-slate-100">
                    Modo: {measurementMode === "WEIGHT" ? "Peso (kg)" : "Unidades"}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 flex flex-col gap-2">
                    <label className="text-sm text-slate-600">Precio seleccionado</label>
                    {priceOptions.length > 0 ? (
                        <select
                            className="border rounded px-2 py-1"
                            value={String(selectedPrice ?? 0)}
                            onChange={(e) => setSelectedPrice(Number(e.target.value) || 0)}
                        >
                            {priceOptions.map((p) => (
                                <option key={`${p.price_id}-${p.price_number}`} value={p.unit_price}>
                                    {p.price_type} #{p.price_number} - ${p.unit_price}
                                    {p.logic_type ? ` (${p.logic_type})` : ""}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="number"
                            className="border rounded px-2 py-1"
                            placeholder="Ingresar precio"
                            value={Number.isFinite(selectedPrice) ? selectedPrice : 0}
                            onChange={(e) => setSelectedPrice(Number(e.target.value) || 0)}
                            min={0}
                            step="0.01"
                        />
                    )}

                    <div className="text-xs text-slate-500">
                        El precio es por {measurementMode === "WEIGHT" ? "kg" : "unidad"}.
                    </div>
                </div>

                {measurementMode === "WEIGHT" ? (
                    <div className="col-span-1 flex flex-col gap-2">
                        <label className="text-sm text-slate-600">Peso leído (kg)</label>
                        <input
                            type="number"
                            className="border rounded px-2 py-1"
                            value={Number.isFinite(weightKg) ? weightKg : 0}
                            onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                            min={0}
                            step="0.01"
                        />
                        <div className="text-xs text-slate-500">Mock por ahora. Se leerá de la balanza.</div>
                    </div>
                ) : (
                    <div className="col-span-1 flex flex-col gap-2">
                        <label className="text-sm text-slate-600">Unidades</label>
                        <input
                            type="number"
                            className="border rounded px-2 py-1"
                            value={Number.isFinite(unitsCount) ? unitsCount : 1}
                            onChange={(e) => setUnitsCount(Math.max(0, Number(e.target.value) || 0))}
                            min={0}
                            step="1"
                        />
                        <div className="text-xs text-slate-500">Seleccionado por el usuario.</div>
                    </div>
                )}

                <div className="col-span-1 flex flex-col gap-2">
                    <label className="text-sm text-slate-600">Resumen</label>
                    <div className="border rounded px-3 py-2">
                        <div className="text-sm">
                            Precio: ${Number(selectedPrice || 0).toFixed(2)} x {Number(quantity || 0)}
                        </div>
                        <div className="text-lg font-semibold">Total: ${Number(total).toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    variant={'default'}
                    disabled={!canAdd}
                    onClick={handleAddItem}
                >
                    Agregar a la orden
                </Button>
            </div>
        </div>
    );
};

export default ScaleDataDisplay;
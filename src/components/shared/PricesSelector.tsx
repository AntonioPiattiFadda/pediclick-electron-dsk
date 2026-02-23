import { useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/utils/prices";
import { Price, PriceLogicType } from "@/types/prices";

// ─── per-type config ────────────────────────────────────────────────────────

const LOGIC_CONFIG: Record<
    PriceLogicType,
    { label: string; badgeClass: string; order: number }
> = {
    QUANTITY_DISCOUNT: {
        label: "Descuento por cantidad",
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        order: 0,
    },
    SPECIAL: {
        label: "Precio especial",
        badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
        order: 1,
    },
    LIMITED_OFFER: {
        label: "Oferta limitada",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
        order: 2,
    },
};

function LogicBadge({ type }: { type: PriceLogicType }) {
    const cfg = LOGIC_CONFIG[type];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.badgeClass}`}
        >
            {cfg.label}
        </span>
    );
}

function formatValidUntil(date: string) {
    return new Date(date).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// ─── component ──────────────────────────────────────────────────────────────

export function PricesSelector({
    prices,
    onSelectPrice,
    selectedPriceId,
    isWeight = false,
}: {
    prices: Price[];
    onSelectPrice: (priceId: number) => void;
    selectedPriceId: number | null;
    isWeight?: boolean;
}) {
    const unit = isWeight ? "kg" : "un.";
    const selectedPrice = prices.find((p) => p.price_id === selectedPriceId) ?? null;

    const groups = useMemo(() => {
        const map = new Map<PriceLogicType, Price[]>();
        for (const p of prices) {
            const arr = map.get(p.logic_type) ?? [];
            arr.push(p);
            map.set(p.logic_type, arr);
        }
        return (["QUANTITY_DISCOUNT", "SPECIAL", "LIMITED_OFFER"] as PriceLogicType[])
            .filter((t) => map.has(t))
            .map((t) => ({
                type: t,
                items: map.get(t)!.slice().sort((a, b) => a.qty_per_price - b.qty_per_price),
            }));
    }, [prices]);

    return (
        <Select
            value={selectedPriceId?.toString() || ""}
            onValueChange={(value) => onSelectPrice(Number(value))}
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar precio">
                    {selectedPrice ? (
                        <span className="flex items-center gap-1.5">
                            <span className="font-semibold text-blue-700">
                                {formatCurrency(selectedPrice.price)}
                            </span>
                            {selectedPrice.qty_per_price > 1 && (
                                <span className="text-xs text-slate-500">
                                    ×{selectedPrice.qty_per_price}+ {unit}
                                </span>
                            )}
                        </span>
                    ) : (
                        "Precio"
                    )}
                </SelectValue>
            </SelectTrigger>

            <SelectContent className="w-[280px]">
                {groups.map(({ type, items }) => (
                    <SelectGroup key={type}>
                        <SelectLabel className="flex items-center gap-2 pb-1">
                            <LogicBadge type={type} />
                        </SelectLabel>

                        {items.map((price) => (
                            <SelectItem
                                key={price.price_id}
                                value={price.price_id?.toString() || ""}
                                className="py-2"
                            >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    {/* Main row: price + qty threshold */}
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-bold text-blue-700">
                                            {formatCurrency(price.price)}
                                        </span>
                                        {price.qty_per_price > 1 ? (
                                            <span className="text-xs text-slate-500">
                                                desde {price.qty_per_price} {unit}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">
                                                por {unit}
                                            </span>
                                        )}
                                        {price.location_id !== null && (
                                            <span className="ml-auto text-[10px] rounded border px-1.5 py-0.5 bg-slate-50 text-slate-500 border-slate-200">
                                                Local
                                            </span>
                                        )}
                                    </div>

                                    {/* Observations */}
                                    {price.observations && (
                                        <span className="text-xs text-slate-500 italic">
                                            {price.observations}
                                        </span>
                                    )}

                                    {/* Validity for limited offers */}
                                    {price.logic_type === "LIMITED_OFFER" && price.valid_until && (
                                        <span className="text-[10px] text-amber-600">
                                            Hasta {formatValidUntil(price.valid_until)}
                                        </span>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
    );
}

import { Price } from "@/types/prices";

export const pricesLogicTypeOptions = [
    { value: "QUANTITY_DISCOUNT", label: "Descuento por cantidad" },
    { value: "SPECIAL", label: "Especial" },
    { value: "LIMITED_OFFER", label: "Oferta limitada" },
];

export const formatCurrency = (
    value: number,
    locale: string = 'es-AR',
    currency: string = 'ARS'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(value);
};

export function resolveEffectivePrice(
    quantity: number,
    selectedPriceId: number | null,
    priceOptions: Price[]
): { effectivePrice: number; price_id: number | null } {
    if (!selectedPriceId || priceOptions.length === 0) {
        return { effectivePrice: 0, price_id: null };
    }

    const selected = priceOptions.find((p) => p.price_id === selectedPriceId);
    if (!selected) {
        return { effectivePrice: 0, price_id: null };
    }

    if (selected.logic_type === "SPECIAL") {
        return {
            effectivePrice: selected.price,
            price_id: selected.price_id || null,
        };
    }

    const now = new Date();

    // LIMITED_OFFER takes priority
    const validLimitedOffer = priceOptions.find(
        (p) =>
            p.logic_type === "LIMITED_OFFER" &&
            (!p.valid_until || new Date(p.valid_until) >= now)
    );

    if (validLimitedOffer) {
        const applicable = priceOptions
            .filter((p) => p.logic_type === "LIMITED_OFFER" && Number(p.qty_per_price) <= quantity)
            .sort((a, b) => Number(b.qty_per_price) - Number(a.qty_per_price))[0];

        if (applicable) {
            return { effectivePrice: applicable.price, price_id: applicable.price_id || null };
        }

        const applicableQty = priceOptions
            .filter((p) => p.logic_type === "QUANTITY_DISCOUNT" && Number(p.qty_per_price) <= quantity)
            .sort((a, b) => Number(b.qty_per_price) - Number(a.qty_per_price))[0];

        if (applicableQty) {
            return { effectivePrice: applicableQty.price, price_id: applicableQty.price_id || null };
        }

        return { effectivePrice: validLimitedOffer.price, price_id: validLimitedOffer.price_id || null };
    }

    // QUANTITY_DISCOUNT
    if (selected.logic_type === "QUANTITY_DISCOUNT") {
        const applicable = priceOptions
            .filter((p) => p.logic_type === "QUANTITY_DISCOUNT" && Number(p.qty_per_price) <= quantity)
            .sort((a, b) => Number(b.qty_per_price) - Number(a.qty_per_price))[0];

        if (applicable) {
            return { effectivePrice: applicable.price, price_id: applicable.price_id || null };
        }

        return { effectivePrice: selected.price, price_id: selected.price_id || null };
    }

    return { effectivePrice: selected.price, price_id: selected.price_id || null };
}

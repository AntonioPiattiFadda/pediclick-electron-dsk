import { Price } from "@/types/prices";

export const pricesTypeAndLogicOptions = {
    price_type: [
        { value: "MINOR", label: "Minorista" },
        { value: "MAYOR", label: "Mayorista" },
    ],
    logic_type: [
        { value: "QUANTITY_DISCOUNT", label: "Descuento por cantidad" },
        { value: "SPECIAL", label: "Especial" },
        { value: "LIMITED_OFFER", label: "Oferta limitada" },
    ],
};

export const formatCurrency = (
    value: number,
    locale: string = 'es-AR',
    currency: string = 'ARS'
): string => {
    return (value).toLocaleString(locale, {
        style: 'currency',
        currency,
    });
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

    const isSpecialPrice = selected.logic_type === "SPECIAL";

    if (isSpecialPrice) {
        return {
            effectivePrice: selected.price / (selected.qty_per_price ?? 1),
            price_id: selected.price_id || null,
        };
    }

    const now = new Date();


    //Validar tmb que la cantidad sea mayor o igual a la cantidad minima de la oferta limitada
    // 🔹 Buscar LIMITED_OFFER válido
    const validLimitedOffer = priceOptions.find(
        (p) =>
            p.logic_type === "LIMITED_OFFER" &&
            (!p.valid_until || new Date(p.valid_until) >= now)
    );

    // --- Caso 1: LIMITED_OFFER válido tiene prioridad ---
    if (validLimitedOffer) {

        const discounts = priceOptions.filter(
            (p) => p.logic_type === "LIMITED_OFFER"
        );

        const applicable = discounts
            .filter((p) => Number(p.qty_per_price) <= quantity)
            .sort(
                (a, b) =>
                    Number(b.qty_per_price) -
                    Number(a.qty_per_price)
            )[0];

        console.log("applicable", applicable);


        if (applicable) {
            return {
                effectivePrice:
                    applicable.price / (applicable.qty_per_price ?? 1),
                price_id: applicable.price_id || null,
            };
        }

        const discountsQty = priceOptions.filter(
            (p) => p.logic_type === "QUANTITY_DISCOUNT"
        );

        const applicableQty = discountsQty
            .filter((p) => Number(p.qty_per_price) <= quantity)
            .sort(
                (a, b) =>
                    Number(b.qty_per_price) -
                    Number(a.qty_per_price)
            )[0];

        console.log("applicableQty", applicableQty);


        if (applicableQty) {
            return {
                effectivePrice:
                    applicableQty.price / (applicableQty.qty_per_price ?? 1),
                price_id: applicableQty.price_id || null,
            };
        }

        return {
            effectivePrice:
                validLimitedOffer.price /
                (validLimitedOffer.qty_per_price ?? 1),
            price_id: validLimitedOffer.price_id || null,
        };
    }

    // --- Caso 2: QUANTITY_DISCOUNT ---
    if (selected.logic_type === "QUANTITY_DISCOUNT") {
        const discounts = priceOptions.filter(
            (p) => p.logic_type === "QUANTITY_DISCOUNT"
        );

        const applicable = discounts
            .filter((p) => Number(p.qty_per_price) <= quantity)
            .sort(
                (a, b) =>
                    Number(b.qty_per_price) -
                    Number(a.qty_per_price)
            )[0];

        console.log("applicable", applicable);


        if (applicable) {
            return {
                effectivePrice:
                    applicable.price / (applicable.qty_per_price ?? 1),
                price_id: applicable.price_id || null,
            };
        }

        // fallback → usar el seleccionado
        return {
            effectivePrice: selected.price / (selected.qty_per_price ?? 1),
            price_id: selected.price_id || null,
        };
    }

    // --- Caso 3: Otros tipos ---
    return {
        effectivePrice: selected.price / (selected.qty_per_price ?? 1),
        price_id: selected.price_id || null,
    };
}
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { priceLogicTypeOpt } from "@/constants";
import { Price } from "@/types/prices";

export function PricesSelector({
    prices,
    onSelectPrice,
    selectedPriceId,
}: {
    prices: Price[]
    onSelectPrice: (priceId: number) => void
    selectedPriceId: number | null
}) {
    return <Select
        value={selectedPriceId?.toString() || ""}
        onValueChange={(value) => onSelectPrice(Number(value))}
    >
        <SelectTrigger className="w-[165px]">
            <SelectValue placeholder="Precios" />
        </SelectTrigger>
        <SelectContent>
            <SelectGroup>
                <SelectLabel>Precios</SelectLabel>
                {prices.map((price: Price) => {
                    return (
                        <SelectItem
                            value={price.price_id?.toString() || ""}
                            key={price.price_id}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="w-full flex justify-between items-center">
                                    {price.price_number} - ${price.price / (price.qty_per_price ?? 1)} - {priceLogicTypeOpt.find(opt => opt.value === price.logic_type)?.label} - {`>=`}{price.qty_per_price}
                                </div>
                                {price.observations && (
                                    <div className="w-full text-xs text-slate-500 italic">
                                        {price.observations}
                                    </div>
                                )}
                            </div>
                        </SelectItem>
                    )
                })}
            </SelectGroup>
        </SelectContent>
    </Select>
}

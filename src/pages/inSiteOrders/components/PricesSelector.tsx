
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { priceLogicTypeOpt, priceTypeOpt } from "@/constants";
import { useOrderContext } from "@/context/OrderContext";
import { Price } from "@/types/prices";

export function PricesSelector({
    prices,
    onSelectPrice
}: {
    prices: Price[]
    onSelectPrice: (priceId: number) => void
}) {

    const { selectedPriceId } = useOrderContext();

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

                                <div className="w-full  flex justify-between items-center">
                                    {price.price_number} - ${price.price / (price.qty_per_price ?? 1)} - {priceTypeOpt.find(opt => opt.value === price.price_type)?.label} - {priceLogicTypeOpt.find(opt => opt.value === price.logic_type)?.label} - {`>=`}{price.qty_per_price}
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




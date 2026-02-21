import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Lot } from "@/types/lots";
import { formatDate } from "@/utils";

export function LotSelector({
    lots,
    onSelectLot,
    selectedLotId,
}: {
    lots: Lot[]
    onSelectLot: (lotId: number) => void
    selectedLotId: number | null
}) {
    if (!lots || lots.length === 0) {
        return null;
    }

    return <Select
        value={selectedLotId?.toString() || ""}
        onValueChange={(value) => onSelectLot(Number(value))}
    >
        <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Lotes" />
        </SelectTrigger>
        <SelectContent>
            <SelectGroup>
                <SelectLabel>Lotes</SelectLabel>
                {lots.map((lot: Lot) => {
                    return (
                        <SelectItem
                            value={lot.lot_id?.toString() || ""}
                            key={lot.lot_id}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="w-full flex justify-between items-center">
                                    {formatDate(lot.created_at)}
                                </div>
                            </div>
                        </SelectItem>
                    )
                })}
            </SelectGroup>
        </SelectContent>
    </Select>
}

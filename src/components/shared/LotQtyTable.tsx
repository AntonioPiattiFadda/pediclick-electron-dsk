import { useMemo } from "react";
import { Lot } from "@/types/lots";
import { OrderItem } from "@/types/orderItems";
import { formatDate } from "@/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function LotQtyTable({
    lots,
    orderItems,
    locationId,
    lotQtyMap,
    onChangeLotQty,
    isWeight = false,
}: {
    lots: Lot[];
    orderItems: OrderItem[];
    locationId: number;
    lotQtyMap: Record<number, number>;
    onChangeLotQty: (lotId: number, qty: number) => void;
    isWeight?: boolean;
}) {
    const unit = isWeight ? "kg" : "un.";

    const sortedLots = useMemo(
        () =>
            [...lots].sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
            ),
        [lots]
    );

    return (
        <Table className="text-sm">
            <TableHeader>
                <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-center">
                        Disponible
                    </TableHead>
                    <TableHead className="text-center w-32">
                        Cantidad ({unit})
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedLots.map((lot) => {
                    const stock = lot.stock?.find(
                        (s) => s.location_id === locationId
                    );
                    const stockQty = stock?.quantity ?? 0;
                    const initial = lot.initial_stock_quantity ?? stockQty;

                    const cartAllocated = orderItems
                        .filter((oi) => oi.lot_id === lot.lot_id)
                        .reduce((s, oi) => s + Number(oi.quantity ?? 0), 0);

                    const typedQty = lotQtyMap[lot.lot_id] ?? 0;
                    const liveRemaining = stockQty - cartAllocated - typedQty;

                    const remainingColor =
                        liveRemaining > 0
                            ? "text-green-600"
                            : liveRemaining === 0
                            ? "text-amber-600"
                            : "text-red-600";

                    return (
                        <TableRow key={lot.lot_id}>
                            <TableCell className="text-slate-600 whitespace-nowrap">
                                {formatDate(lot.created_at)}
                            </TableCell>
                            <TableCell className="text-center">
                                <span className={`font-semibold ${remainingColor}`}>
                                    {liveRemaining}
                                </span>
                                <span className="text-slate-400 text-xs">
                                    {" "}/ {initial}
                                </span>
                            </TableCell>
                            <TableCell className="text-center">
                                <input
                                    type="number"
                                    min={0}
                                    value={lotQtyMap[lot.lot_id] ?? ""}
                                    onChange={(e) => {
                                        const val =
                                            e.target.value === ""
                                                ? 0
                                                : Number(e.target.value);
                                        onChangeLotQty(lot.lot_id, val);
                                    }}
                                    className="w-20 border rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    placeholder="0"
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

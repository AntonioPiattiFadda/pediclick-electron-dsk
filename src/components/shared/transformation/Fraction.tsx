import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createTransformation } from "@/service/transformations"
import type { Location } from "@/types/locations"
import type { Lot } from "@/types/lots"
import type { Product } from "@/types/products"
import type { Transformation } from "@/types/transformation"
import type { TransformationItems } from "@/types/transformationItems"
import { formatDate } from "@/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Rotate3d } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from "../selectors/productPresentationSelector"
import ProductSelector from "../selectors/productSelector"
import { getLotData } from "@/utils/stock"
import { useGetLocationData } from "@/hooks/useGetLocationData"

const generateNewTransformationItems = (isOrigin: boolean, newTransformationId: number, locationId: number) => {
    return {
        transformation_item_id: Math.random(),
        transformation_id: newTransformationId,
        bulk_quantity_equivalence: null,
        product_id: null,
        product_presentation_id: null,
        lot_id: null,
        stock_id: null,
        is_origin: isOrigin,
        quantity: null,
        max_quantity: null,
        product: null,
        product_presentation: null,
        final_cost_per_unit: null,
        final_cost_per_bulk: null,
        final_cost_total: null,
        location_id: locationId,
        lot: null,
    }
}

export function Fraction({
    disabled = false
}: {
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false);

    const [calculated, setCalculated] = useState(false);

    const { handleGetLocationId } = useGetLocationData()

    const [selectedLocation] = useState<Partial<Location> | null>(handleGetLocationId() ? {
        location_id: handleGetLocationId(),
    } : null);

    const queryClient = useQueryClient();

    const newTransformationId = Math.floor(Math.random() * 1000000);

    const getInitialFromTransformationDetails: TransformationItems = generateNewTransformationItems(true, newTransformationId, handleGetLocationId() || 0);

    const getInitialToTransformationDetails: TransformationItems = generateNewTransformationItems(false, newTransformationId, handleGetLocationId() || 0);

    const [fromTransformationItems, setFromTransformationItems] = useState<TransformationItems[]>(
        [
            {
                ...getInitialFromTransformationDetails
            }
        ]
    )
    const [transformation] = useState<Omit<Transformation, 'created_at'>>({
        transformation_id: newTransformationId,
        transformation_cost: 0,
        notes: "",
    } as Transformation)



    const [toTransformationItems, setToTransformationItems] = useState<TransformationItems[]>([
        {
            ...getInitialToTransformationDetails
        }
    ])

    const createTransformationMutation = useMutation({
        mutationFn: async () => {

            return await createTransformation(transformation, fromTransformationItems, toTransformationItems);
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Transformacion:", data)

            console.log("Transformacion creada con éxito", fromTransformationItems[0]?.product_id)

            queryClient.invalidateQueries({ queryKey: ["product_presentations", Number(fromTransformationItems[0]?.product_id)] })
            queryClient.invalidateQueries({ queryKey: ["product_presentations", Number(toTransformationItems[0]?.product_id)] })

            setFromTransformationItems([
                {
                    ...getInitialFromTransformationDetails
                }
            ])
            setToTransformationItems([
                {
                    ...getInitialToTransformationDetails
                }
            ])

            toast.success("Transformación creada con éxito")

            setOpen(false);
        },
        onError: (e) => {
            console.error("Error hacer la transformación", e)
            toast.error("Error al hacer la transformación")
        },
    })



    const handleUpdateToQuantity = (index: number, newQuantity: number) => {
        const fromQty = newQuantity;
        const fromBulkEq = fromTransformationItems[index]?.bulk_quantity_equivalence || 1;

        const toBulkEq = toTransformationItems[index]?.bulk_quantity_equivalence || 1;

        const toQty = (fromQty * fromBulkEq) / toBulkEq;
        const updatedToTransformationItems = [...toTransformationItems];
        updatedToTransformationItems[index] = {
            ...updatedToTransformationItems[index],
            quantity: toQty,
        };
        setToTransformationItems(updatedToTransformationItems);
    };




    return <Dialog open={disabled ? false : open} onOpenChange={setOpen}>
        <form>
            <DialogTrigger asChild>
                <Button
                    disabled={disabled}
                    size={'icon'}
                    variant={'ghost'}
                >
                    <Rotate3d />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Fracciones</DialogTitle>
                    <DialogDescription>
                        Realiza fracciones de productos aquí.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border border-gray-200 rounded-lg ">


                    <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-4">
                        <div className="flex justify-between">
                            <span className="col-span-6">Desde:</span>

                        </div>
                        {fromTransformationItems.map((td, index) => {
                            const locationLots =
                                td.product_presentation?.lots?.filter((lot: Lot) =>
                                    lot.stock?.some((s) => Number(s.location_id) === Number(selectedLocation?.location_id))
                                ) || [];
                            return (<div
                                key={td.transformation_item_id}
                                className="grid grid-cols-6
                                    gap-2"
                            >
                                <div className="col-span-3  flex flex-col gap-1">
                                    <Label>Producto Nro: {index + 1}</Label>
                                    <ProductSelector
                                        value={td.product ?? {} as Product}
                                        onChange={
                                            (product: Partial<Product>) => {
                                                const productIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);
                                                const updatedDetails = [...fromTransformationItems];
                                                updatedDetails[productIndex] = {
                                                    ...updatedDetails[productIndex],
                                                    product_id: product?.product_id || null,
                                                    product: product,
                                                };
                                                setFromTransformationItems(updatedDetails);

                                            }}
                                    />
                                </div>
                                <div className="col-span-3  flex flex-col gap-1">
                                    <Label>Presentación</Label>
                                    <ProductPresentationSelectorRoot
                                        locationId={handleGetLocationId()}
                                        productId={td.product_id}
                                        value={td.product_presentation}
                                        onChange={(presentation) => {
                                            console.log("Selected presentation:", presentation);
                                            const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                            const firstLotData = getLotData(presentation?.lots || [], null, Number(selectedLocation?.location_id));

                                            const updatedFromTransformationItems = [...fromTransformationItems];
                                            updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                lot_id: firstLotData.lot_id || null,
                                                lot: firstLotData ? { ...firstLotData, expiration_date: firstLotData.expiration_date ?? null } : null,
                                                stock_id: firstLotData.stock_id || null,
                                                max_quantity: firstLotData.max_quantity || null,
                                                product_presentation_id: presentation?.product_presentation_id ?? null,
                                                product_presentation: presentation,
                                                bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                            };

                                            setFromTransformationItems(updatedFromTransformationItems);

                                            setToTransformationItems((prev) => {
                                                const updatedToItems = [...prev];
                                                updatedToItems[index] = {
                                                    ...updatedToItems[index],
                                                    quantity: 0,
                                                };
                                                return updatedToItems;
                                            }
                                            );


                                        }}
                                        isFetchWithLots={true}
                                    >
                                        <SelectProductPresentation />
                                    </ProductPresentationSelectorRoot>
                                </div>


                                <div className="flex flex-col gap-1  col-span-3">
                                    <Label>Lote</Label>
                                    <Select
                                        disabled={locationLots.length === 0}
                                        value={td.lot_id ? String(td.lot_id) : undefined}
                                        onValueChange={(value) => {
                                            const lotData = getLotData(td.product_presentation?.lots || [], Number(value), Number(selectedLocation?.location_id));
                                            const fromTransformationItemsIndex = fromTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                            const updatedFromTransformationItems = [...fromTransformationItems];
                                            updatedFromTransformationItems[fromTransformationItemsIndex] = {
                                                ...updatedFromTransformationItems[fromTransformationItemsIndex],
                                                lot_id: Number(value),
                                                stock_id: lotData.stock_id || null,
                                                max_quantity: lotData.max_quantity || null,
                                                final_cost_total: lotData.final_cost_total || 0,
                                                final_cost_per_bulk: lotData.final_cost_per_bulk || 0,
                                                final_cost_per_unit: lotData.final_cost_per_unit || 0,
                                            };
                                            setFromTransformationItems(updatedFromTransformationItems);

                                            const updatedToTransformationItems = [...toTransformationItems];
                                            updatedToTransformationItems[index] = {
                                                ...updatedToTransformationItems[index],
                                                lot: lotData ? { ...lotData, expiration_date: lotData.expiration_date ?? null } : null,
                                            };
                                            setToTransformationItems(updatedToTransformationItems);
                                        }
                                        } >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona el lote" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Lotes</SelectLabel>
                                                {locationLots.map((lot) => (
                                                    <SelectItem key={lot.lot_id} value={String(lot.lot_id)}>{formatDate(lot.created_at || '')}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1 col-span-3">
                                    <Label>Cantidad</Label>
                                    <InputGroup>
                                        <InputGroupInput
                                            placeholder="Cantidad"
                                            type="number"
                                            disabled={!td.lot_id || !td.max_quantity}
                                            value={td.quantity ?? ''}
                                            onChange={(e) => {
                                                const newValue = Number((e.target as HTMLInputElement).value);
                                                if (newValue > (td.max_quantity || 0)) {
                                                    toast.error(`La cantidad no puede ser mayor a la cantidad máxima disponible: ${td.max_quantity}`);
                                                    return
                                                }
                                                setFromTransformationItems((prev) => prev.map((item) => item.transformation_item_id === td.transformation_item_id ? { ...item, quantity: newValue } : item));
                                                handleUpdateToQuantity(index, newValue);
                                            }} />
                                        {/* <InputGroupAddon>
                                                <Search />
                                            </InputGroupAddon> */}
                                        <InputGroupAddon align="inline-end"> {td.max_quantity ? `/ ${td.max_quantity}` : 'S/S'}</InputGroupAddon>
                                    </InputGroup>

                                </div>

                            </div>)
                        }

                        )}


                    </div>

                    <div className=" border-r border-l border-gray-200  flex flex-col gap-2">

                    </div>

                    <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-4">
                        <div className="flex justify-between">
                            <span className="col-span-6">Hacia:</span>

                        </div>
                        {toTransformationItems.map((td, index) => {

                            return (<div
                                key={td.transformation_item_id}
                                className="grid grid-cols-6
                                    gap-2"
                            >

                                <div className="col-span-3  flex flex-col gap-1">
                                    <Label>Producto Nro: {index + 1}</Label>
                                    <ProductSelector
                                        disabled={false}
                                        value={td.product ?? {} as Partial<Product>}
                                        onChange={
                                            (product: Partial<Product>) => {
                                                const productIndex = toTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);
                                                const updatedDetails = [...toTransformationItems];
                                                updatedDetails[productIndex] = {
                                                    ...updatedDetails[productIndex],
                                                    product_id: product?.product_id || null,
                                                    product: product,
                                                    quantity: 0,
                                                };
                                                setToTransformationItems(updatedDetails);

                                            }}
                                    />
                                </div>
                                <div className="col-span-3  flex flex-col gap-1">
                                    <Label>Presentación</Label>
                                    <ProductPresentationSelectorRoot
                                        locationId={handleGetLocationId()}
                                        productId={td.product_id}
                                        value={td.product_presentation}

                                        onChange={(presentation) => {
                                            const toTransformationItemsIndex = toTransformationItems.findIndex((item) => item.transformation_item_id === td.transformation_item_id);

                                            const updatedToTransformationItemss = [...toTransformationItems];
                                            updatedToTransformationItemss[toTransformationItemsIndex] = {
                                                ...updatedToTransformationItemss[toTransformationItemsIndex],
                                                product_presentation_id: presentation?.product_presentation_id ?? null,
                                                product_presentation: presentation,
                                                bulk_quantity_equivalence: presentation?.bulk_quantity_equivalence ?? null,
                                                quantity: 0,
                                            };

                                            setToTransformationItems(updatedToTransformationItemss);

                                        }}
                                        isFetchWithLots={true}
                                    >
                                        <SelectProductPresentation />
                                    </ProductPresentationSelectorRoot>
                                </div>

                                <div className="col-span-3 flex flex-col gap-1">
                                    <Label>Cantidad</Label>
                                    <Input
                                        placeholder="Cantidad"
                                        type="number"
                                        value={td.quantity ?? ''}
                                        onChange={(e) => {
                                            setToTransformationItems((prev) => prev.map((item) => item.transformation_item_id === td.transformation_item_id ? { ...item, quantity: Number((e.target as HTMLInputElement).value) } : item));
                                        }}
                                    />
                                </div>

                                <div className="col-span-1 flex flex-col gap-1">
                                    <Label className="text-transparent">Calcular</Label>
                                    <Button
                                        size={'icon'}
                                        variant='ghost'
                                        onClick={() => {
                                            setToTransformationItems((prev) => {
                                                const updatedToItems = [...prev];
                                                const fromQty = fromTransformationItems[index]?.quantity || 0;
                                                const fromBulkEq = fromTransformationItems[index]?.bulk_quantity_equivalence || 1;
                                                const toBulkEq = updatedToItems[index]?.bulk_quantity_equivalence || 1;
                                                const toQty = (fromQty * fromBulkEq) / toBulkEq;
                                                updatedToItems[index] = { ...updatedToItems[index], quantity: toQty };
                                                return updatedToItems;
                                            });
                                            setCalculated(true);
                                            setTimeout(() => {
                                                setCalculated(false);
                                            }, 1500);
                                        }}
                                    >
                                        {calculated ? '✔️' : 'Auto'}
                                    </Button>
                                </div>
                            </div>)
                        }
                        )}
                    </div>

                </div>
                <DialogFooter>

                    <Button
                        disabled={createTransformationMutation.isPending}
                        onClick={() => {
                            const hasFromQty = fromTransformationItems.some((item) => (item?.quantity ?? 0) > 0);
                            const hasToQty = toTransformationItems.some((item) => (item?.quantity ?? 0) > 0);

                            if (!hasFromQty || !hasToQty) {
                                toast.error("Debe ingresar cantidades mayores a 0 en ambos lados de la fracción");
                                return;
                            }

                            createTransformationMutation.mutate();
                        }}
                    >
                        {createTransformationMutation.isPending ? 'Creando...' : 'Crear Transformación'}

                    </Button>
                </DialogFooter>
            </DialogContent>
        </form>
    </Dialog >

}




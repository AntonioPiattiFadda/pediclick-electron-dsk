/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDispatch } from "react-redux";
import { setProductPresentations } from "@/stores/orderSlice";
import { createProductPresentation, getProductPresentations } from "@/service/productPresentations";
import type { ProductPresentation } from "@/types/productPresentation";
import type { Product } from "@/types/products";
import { sliceLongNames } from "@/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { PlusCircle, RefreshCw, X } from "lucide-react";
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import toast from "react-hot-toast";
import ProductSelector from "./productSelector";


// ---------- Context ----------
interface ProductPresentationSelectorContextType {
    value: Partial<ProductPresentation> | null;
    onChange: (id: Partial<ProductPresentation> | null) => void;
    disabled: boolean;
    presentations: Partial<ProductPresentation>[];
    isLoading: boolean;
    productId: number | null;
    refetch: () => void;
    isRefetching: boolean;
    isFetchWithLots: boolean;
    isFetchWithLotContainersLocation: boolean;
    shortCode: number | null;
    onChangeShortCode: (shortCode: number | null) => void;
    locationId: number;
}

const ProductPresentationSelectorContext =
    createContext<ProductPresentationSelectorContextType | null>(null);

function useProductPresentationSelectorContext() {
    const ctx = useContext(ProductPresentationSelectorContext);
    if (!ctx)
        throw new Error(
            "ProductPresentationSelector components must be used inside Root"
        );
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    productId: number | null;
    value: Partial<ProductPresentation> | null;
    onChange: (id: Partial<ProductPresentation> | null) => void;
    disabled?: boolean;
    children: ReactNode;
    isFetchWithLots?: boolean;
    isFetchWithLotContainersLocation?: boolean;
    locationId: number;
}
const ProductPresentationSelectorRoot = ({
    productId,
    value,
    onChange,
    disabled = false,
    children,
    isFetchWithLots = false,
    isFetchWithLotContainersLocation = false,
    locationId

}: RootProps) => {

    console.log("Rendering ProductPresentationSelectorRoot with productId:", productId, "isFetchWithLots:", isFetchWithLots, "isFetchWithLotContainersLocation:", isFetchWithLotContainersLocation, "locationId:", locationId);

    const dispatch = useDispatch();

    const [shortCode, setShortCode] = useState<number | null>(null);

    const { data: presentations,
        isLoading,
        isError,
        refetch,
        isRefetching
    } = useQuery({
        queryKey: ["product_presentations", Number(productId)],
        queryFn: async () => {
            const presentations = await getProductPresentations(productId, isFetchWithLots, isFetchWithLotContainersLocation, locationId);
            dispatch(setProductPresentations(presentations as any));
            return presentations;
        },
        enabled: !!productId,
    });


    const hasHandledInitialFetch = useRef(false);

    const productIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (productIdRef.current !== productId) {
            hasHandledInitialFetch.current = false;
            productIdRef.current = productId;
        }
        if (
            !isLoading &&
            presentations &&
            !hasHandledInitialFetch.current
        ) {
            hasHandledInitialFetch.current = true;
            if (shortCode !== null) {

                const matched = (presentations as Partial<ProductPresentation>[]).find((p) => (p as any)?.short_code === shortCode);
                console.log("matched:", matched);
                const adaptedMatched = matched ? matched : null;
                if (adaptedMatched) {
                    onChange(adaptedMatched);
                }
            } else {
                onChange((presentations as Partial<ProductPresentation>[])[0] || null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, productId]);

    if (isError) {
        return <div>Error loading product presentations.</div>;
    }

    return (
        <ProductPresentationSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                presentations: presentations as Partial<ProductPresentation>[] ?? [],
                isLoading,
                productId,
                refetch,
                isRefetching,
                isFetchWithLots,
                isFetchWithLotContainersLocation,
                shortCode,
                onChangeShortCode: setShortCode,
                locationId,
            }}
        >
            <div className="flex items-center gap-2 w-full h-10">{children}</div>
        </ProductPresentationSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectProductPresentation = ({ children, focusRef }: {
    children?: ReactNode;
    focusRef?: React.RefObject<HTMLInputElement>;
}) => {
    const { value, onChange, disabled, presentations, isLoading, refetch, isRefetching, shortCode, onChangeShortCode } =
        useProductPresentationSelectorContext();



    const handleShortCodeMatch = (shortCode: number | null) => {
        if (shortCode === null) return;
        const matched = (presentations as Partial<ProductPresentation>[]).find((p) => p.short_code === shortCode);
        if (matched) {
            debouncedToast.cancel();
            onChange(matched);
        } else {
            onChange(null);
            debouncedToast(`No se encontró una presentación con ese código: ${shortCode}`);
        }
    };

    const debouncedToast = useMemo(
        () =>
            debounce((msg: string) => {
                toast(`${msg}`, {
                    icon: "⚠️",
                });
            }, 500),
        []
    );

    // if (isLoading) {
    //     return (
    //         <Input
    //             className="h-10"
    //             placeholder="Buscando presentaciones..."
    //             disabled
    //         />
    //     );
    // }




    return (
        <>
            <input
                type="number"
                className={`border border-gray-200 h-9 w-16 rounded-lg p-3 text-sm text-center`}
                value={shortCode === null ? "" : String(shortCode)}
                ref={focusRef}
                placeholder="--"
                onChange={(e) => {
                    const value = e.target.value;
                    onChangeShortCode(value === '' ? null : Number(value));
                    // onChangeShortCode(Number(value) || null);
                    handleShortCodeMatch(Number(value) || null);
                }}

            />

            {isLoading ? (
                <Skeleton className="h-9 w-full" />
            ) : (

                <Select
                    disabled={disabled}
                    value={value === null ? "" : String(value.product_presentation_id)}
                    onValueChange={(val) => {
                        onChange(val === "" ? null : presentations.find((p) => p.product_presentation_id === Number(val)) || null);
                        onChangeShortCode(presentations.find((p) => p.product_presentation_id === Number(val))?.short_code || null);
                    }}
                >
                    <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Seleccionar presentación" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Presentaciones</SelectLabel>
                            {presentations?.map((p) => {
                                return <SelectItem
                                    key={p.product_presentation_id}
                                    value={String(p.product_presentation_id)}
                                >

                                    {`${p.short_code ? `${p.short_code} - ` : ''}`} {sliceLongNames(15, p.product_presentation_name)}   {`${p.bulk_quantity_equivalence && `X${p.bulk_quantity_equivalence}`}`}
                                </SelectItem>
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select >

            )}


            <Button
                onClick={() => {
                    refetch();
                }}
                size={'icon'}
                // disabled={ }
                variant="outline">
                <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>

            {/* <Input
                className={`border border-gray-200 h-9 w-22 `}
                value={presentations.find((p) => p.product_presentation_id === value?.product_presentation_id)?.bulk_quantity_equivalence ?? ''}
                placeholder="Unidad/Kg por presentación"
                disabled
                
                /> */}

            {children}
        </>
    );
};

const CancelProductPresentationSelection = () => {
    const { value, onChange } =
        useProductPresentationSelectorContext();

    return value && (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            className="text-red-500 hover:text-red-700 h-9"
        >
            <X className="w-5 h-5" />
        </Button>
    )

}

// const FastConvertProductPresentation = () => {
//     const { value, presentations } =
//         useProductPresentationSelectorContext();
//     if (!value) return null;


//     const valueBulkEquivalence = value.bulk_quantity_equivalence;

//     const bulkPresentation = presentations.find(p => p.bulk_quantity_equivalence && p.bulk_quantity_equivalence > 0);
//     if (!bulkPresentation) return null;



//     return (
//         <Dialog>
//             <form>
//                 <DialogTrigger asChild>
//                     <Button variant="outline">Convertir</Button>
//                 </DialogTrigger>
//                 <DialogContent className="sm:max-w-[425px]">
//                     <DialogHeader>
//                         <DialogTitle>Edit profile</DialogTitle>
//                         <DialogDescription>
//                             Make changes to your profile here. Click save when you&apos;re
//                             done.
//                         </DialogDescription>
//                     </DialogHeader>
//                     <div className="grid grid-cols-2 gap-4">
//                         <div className="grid gap-3">
//                             {valueBulkEquivalence}
//                         </div>

//                         <div className="grid gap-3">
//                             {valueBulkEquivalence}
//                         </div>

//                     </div>
//                     <DialogFooter>
//                         <DialogClose asChild>
//                             <Button variant="outline">Cancel</Button>
//                         </DialogClose>
//                         <Button type="submit">Save changes</Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </form>
//         </Dialog>
//     )



// }

// ---------- Create ----------
const CreateProductPresentation = ({
    isShortCut = false,
}: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled, productId } = useProductPresentationSelectorContext();
    const queryClient = useQueryClient();

    const [newPresentation, setNewPresentation] = useState("");
    const [product, setProduct] = useState<Partial<Product>>({} as Partial<Product>);
    const [newShortCode, setNewShortCode] = useState<number | null>(null);
    const [newBulkQuantityEquivalence, setNewBulkQuantityEquivalence] = useState<number | null>(null);
    const [open, setOpen] = useState(false);

    const createMutation = useMutation({
        mutationFn: async (data: {
            name: string;
            shortCode: number | null;
            productId: number;
            bulkQuantityEquivalence: number | null;
        }) => {
            return await createProductPresentation(data.name, data.shortCode, data.productId, data.bulkQuantityEquivalence);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["product_presentations", productId ? productId : product?.product_id],
            });
            onChange(data.product_presentation_id);
            setOpen(false);
            setNewPresentation("");
            setNewShortCode(null);
            if (isShortCut) {
                toast("Presentación creada", { icon: "✅" });
            }
        },
        onError: (error: any) => {
            toast(error.message, {
                icon: "⚠️",
            });
        },
    });

    const handleCreate = async () => {
        if (!newPresentation || (productId === null && !product?.product_id)) return;
        try {
            await createMutation.mutateAsync({
                name: newPresentation,
                shortCode: newShortCode,
                productId: productId ? productId : product.product_id || 0,
                bulkQuantityEquivalence: newBulkQuantityEquivalence,
            });
        } catch (err) {
            console.error("Error creating presentation:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Presentación</SidebarMenuButton>
                ) : (
                    <Button
                        size={'icon'}
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        <PlusCircle className="w-5 h-5 " />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nueva presentación</DialogTitle>
                    <DialogDescription>
                        Ingresá el nombre de la presentación del producto.
                    </DialogDescription>
                </DialogHeader>

                {productId === null && (
                    <>
                        <Label className="mt-2 mb-1">Producto</Label>
                        <ProductSelector
                            // focusOrder={3}
                            value={product}
                            onChange={setProduct}
                        />
                    </>
                )}

                <Input
                    value={newPresentation}
                    disabled={createMutation.isPending}
                    onChange={(e) => setNewPresentation(e.target.value)}
                    placeholder="Nombre de la presentación"
                />

                <Label className="mt-2 mb-1">Código corto</Label>
                <Input
                    value={newShortCode === null ? "" : String(newShortCode)}
                    type="number"
                    disabled={createMutation.isPending}
                    onChange={(e) => setNewShortCode(e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="Código corto"
                />

                <Label className="mt-2 mb-1">Código corto</Label>
                <Input
                    value={newBulkQuantityEquivalence === null ? "" : String(newBulkQuantityEquivalence)}
                    type="number"
                    disabled={createMutation.isPending}
                    onChange={(e) => setNewBulkQuantityEquivalence(e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="Unidad/Kg por presentacion"
                />




                <DialogFooter>
                    <Button
                        disabled={createMutation.isPending}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={createMutation.isPending || !newPresentation || (productId === null && !product?.product_id)}
                        onClick={handleCreate}
                    >
                        {createMutation.isPending ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ---------- Compound export ----------
export {
    CancelProductPresentationSelection, CreateProductPresentation,
    ProductPresentationSelectorRoot,
    SelectProductPresentation
};



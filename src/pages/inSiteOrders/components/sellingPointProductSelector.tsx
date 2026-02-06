import { useOrderContext } from "@/context/OrderContext"
import { useMemo } from 'react'
import { ProductPresentationSelectorRoot, SelectProductPresentation } from '../../../components/shared/selectors/productPresentationSelector'
import ProductSelector from '../../../components/shared/selectors/productSelector'
import { Fraction } from '../../../components/shared/transformation/Fraction'
import { Label } from '../../../components/ui/label'
import { useGetLocationData } from "@/hooks/useGetLocationData"
import { useFocusableInput } from "@/hooks/useFocus"

const SellingPointProductSelector = () => {
    const {
        selectedProduct,
        setSelectedProduct,
        productPresentations,
        productPresentation,
        setProductPresentation,
        setSelectedStockId,
        setSelectedPriceId,
        setEffectivePrice,
        selectedStockId,
        selectedLotId,
        setSelectedLotId,
        sellPriceType
    } = useOrderContext();
    const { handleGetLocationId } = useGetLocationData();

    const productPresentationId = productPresentation?.product_presentation_id;

    const selectedProductPresentation = useMemo(() => {
        return productPresentations.find(pp => pp.product_presentation_id === productPresentationId) || null;
    }, [productPresentations, productPresentationId]);

    const selectedLot = useMemo(() => {
        if (!selectedProductPresentation?.lots) return null;

        return (
            selectedProductPresentation?.lots.find(
                (lot) => lot.lot_id === selectedLotId
            ) ?? null
        );
    }, [selectedProductPresentation?.lots, selectedLotId]);

    const selectedStock = useMemo(() => {
        if (!selectedLot?.stock) return null;

        return (
            selectedLot.stock.find(
                (stock) => stock.stock_id === selectedStockId
            ) ?? null
        );
    }, [selectedLot, selectedStockId]);

    const noProductNorProductPresentationSelected = !selectedProduct.product_id || !productPresentation?.product_presentation_id || selectedStock?.quantity === 0;

    const productShortCodeRef = useFocusableInput("product-shortcode", 1);

    const productPresentationShortCodeRef = useFocusableInput("product-presentation-shortcode", 2);

    return (<>
        <div className='flex flex-col gap-2'>

            <div className='grid grid-cols-16 gap-2'>
                <div className='flex flex-col col-span-7 gap-1'>
                    <Label>
                        Producto:
                    </Label>
                    <ProductSelector
                        focusRef={productShortCodeRef}
                        value={selectedProduct}
                        onChange={(value) =>
                            setSelectedProduct({ ...selectedProduct, ...value })
                        }
                    />
                </div>
                <div className='flex flex-col gap-1 col-span-8 '>
                    <Label>
                        Presentación:
                    </Label>
                    <ProductPresentationSelectorRoot

                        locationId={handleGetLocationId()}
                        productId={selectedProduct.product_id!}
                        value={productPresentation}
                        onChange={(value) => {
                            const firstLotId = value?.lots?.[0]?.lot_id || null;
                            const firstStockOfFirstLotId = value?.lots?.[0]?.stock?.[0]?.stock_id || null;

                            const prices = value?.prices || [];
                            const somePriceHasLocationId = prices.some((p) => p.location_id);
                            const firstFilteredPrices = somePriceHasLocationId ? prices.filter((p) => p.location_id === handleGetLocationId()) : prices;
                            const filteredPrices = firstFilteredPrices.filter((p) => p.price_type === sellPriceType);
                            const firstPrice = filteredPrices?.[0] || null;

                            value && setProductPresentation(value)

                            value && setSelectedLotId(firstLotId)

                            value && setSelectedStockId(firstStockOfFirstLotId)

                            value && setSelectedPriceId(firstPrice?.price_id || null)

                            value && setEffectivePrice(firstPrice?.price || 0)
                        }}
                        isFetchWithLots={true}
                        isFetchWithLotContainersLocation={false}
                    >
                        <SelectProductPresentation
                            focusRef={productPresentationShortCodeRef}
                        />
                        {/* <CreateProductPresentation /> */}
                    </ProductPresentationSelectorRoot>
                </div>
                <div className='mt-auto mb-[2px]'>
                    <Fraction
                        disabled={noProductNorProductPresentationSelected}
                    // initialFromTransformationDetails={initialFromTransformationDetails}
                    />

                </div>
            </div>
        </div>




    </>

    )
}

export default SellingPointProductSelector

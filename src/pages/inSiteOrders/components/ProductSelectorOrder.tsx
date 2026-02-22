import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/stores/store"
import { setSelectedProduct, setProductPresentation } from "@/stores/orderSlice"
import { ProductPresentationSelectorRoot, SelectProductPresentation } from '../../../components/shared/selectors/productPresentationSelector'
import ProductSelector from '../../../components/shared/selectors/productSelector'
import { Fraction } from '../../../components/shared/transformation/Fraction'
import { Label } from '../../../components/ui/label'
import { useGetLocationData } from "@/hooks/useGetLocationData"
import { useFocusableInput } from "@/hooks/useFocus"

const ProductSelectorOrder = () => {
    const dispatch = useDispatch<AppDispatch>()
    const selectedProduct = useSelector((state: RootState) => state.order.selectedProduct)
    const productPresentation = useSelector((state: RootState) => state.order.productPresentation)

    const { handleGetLocationId } = useGetLocationData();

    const noProductNorProductPresentationSelected =
        !selectedProduct.product_id || !productPresentation?.product_presentation_id;

    const productShortCodeRef = useFocusableInput("product-shortcode", 1);
    const productPresentationShortCodeRef = useFocusableInput("product-presentation-shortcode", 2);

    return (
        <>
            <div className='flex flex-col gap-2'>
                <div className='grid grid-cols-16 gap-2'>
                    <div className='flex flex-col col-span-7 gap-1'>
                        <Label>Producto:</Label>
                        <ProductSelector
                            focusRef={productShortCodeRef}
                            value={selectedProduct}
                            onChange={(value) =>
                                dispatch(setSelectedProduct({ ...selectedProduct, ...value }))
                            }
                        />
                    </div>
                    <div className='flex flex-col gap-1 col-span-8'>
                        <Label>Presentación:</Label>
                        <ProductPresentationSelectorRoot
                            locationId={handleGetLocationId()}
                            productId={selectedProduct.product_id!}
                            value={productPresentation}
                            onChange={(value) => {
                                if (value) dispatch(setProductPresentation(value));
                            }}
                            isFetchWithLots={true}
                            isFetchWithLotContainersLocation={false}
                        >
                            <SelectProductPresentation
                                focusRef={productPresentationShortCodeRef}
                            />
                        </ProductPresentationSelectorRoot>
                    </div>
                    <div className='mt-auto mb-[2px]'>
                        <Fraction
                            disabled={noProductNorProductPresentationSelected}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProductSelectorOrder

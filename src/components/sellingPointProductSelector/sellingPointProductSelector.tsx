import ProductSelector from '../shared/productSelector'
import { useOrderContext } from "@/context/OrderContext"

const SellingPointProductSelector = () => {
    const { selectedProduct, setSelectedProduct } = useOrderContext()
    console.log(setSelectedProduct)
    return (
        <div>
            Selecciona producto:
            <ProductSelector value={selectedProduct} onChange={setSelectedProduct} />
        </div>
    )
}

export default SellingPointProductSelector
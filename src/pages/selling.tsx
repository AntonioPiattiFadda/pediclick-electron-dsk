import SellingPointProductSelector from "@/components/sellingPointProductSelector/sellingPointProductSelector"


const Selling = () => {

    return (
        <div className="grid grid-cols-3">
            <SellingPointProductSelector />
            <div>Orden de compra</div>
            <div>Datos de la balanza</div>
        </div>
    )
}

export default Selling
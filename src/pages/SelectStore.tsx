import { StoreSelector } from "@/components/shared/StoresSelector"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const SelectStore = () => {
    const [selectedStore, setSelectedStore] = useState<number | null>(null)

    const navigate = useNavigate()
    return (
        <div>
            Selecciona punto de venta
            <StoreSelector
                value={selectedStore}
                onChange={setSelectedStore}
                disabled={false}
            />
            <button onClick={() => {
                localStorage.setItem("selectedStore", JSON.stringify(selectedStore))
                navigate("/selling")
            }}>Confirmar</button>
        </div>
    )
}

export default SelectStore
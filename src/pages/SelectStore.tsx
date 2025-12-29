import { LocationSelectorRoot, SelectLocation } from "@/components/shared/selectors/locationSelector"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useGetLocationData } from "@/hooks/useGetLocationData"
import { Location } from "@/types/locations"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const SelectStore = () => {
    const [selectedStore, setSelectedStore] = useState<Location | null>(null)
    const navigate = useNavigate()

    const { handleSetLocation } = useGetLocationData();

    return (
        <div className="w-screen h-[80vh] flex items-center justify-center ">
            <div className="flex flex-col gap-4 w-lg">
                <Label>Selecciona una Punto de venta</Label>
                <LocationSelectorRoot
                    filter="STORES"
                    value={selectedStore}
                    onChange={setSelectedStore}>
                    <SelectLocation />
                </LocationSelectorRoot>

                <Button
                    disabled={selectedStore === null}
                    onClick={() => {
                        handleSetLocation(selectedStore!)
                        navigate("/orders")
                    }}
                >
                    Confirmar
                </Button>

            </div>
        </div>
    )
}

export default SelectStore
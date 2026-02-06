import { Location } from "@/types/locations";

export const useGetLocationData = () => {

    const handleSetLocation = (locationData: Location) => {
        localStorage.setItem("selectedStore", JSON.stringify({
            ...locationData
        }));
    }

    const handleGetLocation = () => {
        const storedLocation = localStorage.getItem("selectedStore")
        return storedLocation ? JSON.parse(storedLocation) : null;
    }

    const handleGetLocationId = () => {
        const location = handleGetLocation();
        return location ? location.location_id : null;
    }

    const handleRemoveLocation = () => {
        localStorage.removeItem("selectedStore");
    }

    return { handleGetLocation, handleSetLocation, handleGetLocationId, handleRemoveLocation };
}
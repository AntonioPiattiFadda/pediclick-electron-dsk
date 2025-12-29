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

    return { handleGetLocation, handleSetLocation, handleGetLocationId };
}
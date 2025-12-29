import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";
import type { Location } from "@/types/locations";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const createLocation = async (formData: any) => {
    const businessOwnerId = await getBusinessOwnerId();

    const formattedLocation = {
        ...formData,
        business_owner_id: businessOwnerId,
    };

    const { data, error } = await supabase
        .from("locations")
        .insert(formattedLocation)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { data };
};

export const getLocations = async () => {
    const businessOwnerId = await getBusinessOwnerId();

    const { data: locations, error } = await supabase
        .from("locations")
        .select("*")
        .eq("business_owner_id", businessOwnerId)
        .is("deleted_at", null)
        .order("name", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return { locations };
};

// export const getLocationById = async (locationId: string | number) => {
//     const { data: location, error } = await supabase
//         .from("locations")
//         .select("*")
//         .eq("location_id", Number(locationId))
//         .single();

//     if (error) {
//         throw new Error(error.message);
//     }

//     return { location };
// };

export const editLocation = async (
    locationId: string | number,
    formData: Partial<Location>
) => {
    const { data, error } = await supabase
        .from("locations")
        .update(formData)
        .eq("location_id", Number(locationId))
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { data };
};

export const deleteLocation = async (locationId: string | number) => {
    const { data, error } = await supabase
        .from("locations")
        .update({ deleted_at: new Date() })
        .eq("location_id", Number(locationId))
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { data };
};

import { Location } from "./locations";
import { OrderItem } from "./orderItems";
import { OrderT } from "./orders";
import { UserProfile } from "./users";


export type PrintTicketPayload = {
    user: UserProfile | null;
    location: Location;
    order: OrderT;
    orderItems: OrderItem[];
};
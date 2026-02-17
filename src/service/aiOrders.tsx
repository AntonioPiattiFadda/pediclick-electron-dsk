import { OrderItem } from "@/types/orderItems";
import { BACKEND_URL } from ".";
import { getOrganizationId } from "./profiles";

export interface CreateAiOrderRequest {
  locationId: number;
  clientId: number | null;
  message: string;
}

export interface CreateAiOrderResponse {
  orderItems: OrderItem[];
}

/**
 * Creates an AI-assisted order by processing natural language text input
 * TODO: Implement actual API call to AI service
 *
 * @param request - Contains  location, client IDs and text description
 * @returns Promise with array of generated OrderItems
 */
export const createAiOrder = async (
  request: CreateAiOrderRequest
): Promise<OrderItem[]> => {
  const organizationId = await getOrganizationId();

  const reqBody = {
    locationId: request.locationId,
    message: request.message,
    organizationId: organizationId,
    clientId: request.clientId,
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/delivery-orders/ai-generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });

  console.log("AI Order Creation Request:", response);

  if (!response.ok) {
    throw new Error(`Failed to create AI order: ${response.statusText}`);
  }

  return response.json();
}

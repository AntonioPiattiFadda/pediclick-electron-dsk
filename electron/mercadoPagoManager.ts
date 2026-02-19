import QRCode from 'qrcode';
import { envConfig } from './config';

const MP_BASE = 'https://api.mercadopago.com';

function headers(): Record<string, string> {
  const token = envConfig.VITE_APP_MP_ACCESS_TOKEN
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': `${Date.now()}-${Math.random()}`,
  };
}

// ─── Point Integration ───────────────────────────────────────────────────────

export async function listPointDevices() {
  const r = await fetch(`${MP_BASE}/v1/point/integration-api/devices`, {
    headers: headers(),
  });
  return r.json();
}

export async function createPointIntent(
  amount: number,
  description: string,
  externalRef: string,
) {
  const deviceId = process.env.MP_POINT_DEVICE_ID;
  const r = await fetch(
    `${MP_BASE}/v1/point/integration-api/devices/${deviceId}/payment-intents`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        amount,
        additional_info: {
          external_reference: externalRef,
          print_on_terminal: true,
          ticket_number: externalRef.slice(0, 20),
        },
        description,
      }),
    },
  );
  return r.json();
}

export async function cancelPointIntent() {
  const deviceId = process.env.MP_POINT_DEVICE_ID;
  const r = await fetch(
    `${MP_BASE}/v1/point/integration-api/devices/${deviceId}/payment-intents`,
    { method: 'DELETE', headers: headers() },
  );
  if (r.status === 204) return { success: true };
  return r.json();
}

export async function checkPointIntent(intentId: string) {
  const r = await fetch(
    `${MP_BASE}/v1/point/integration-api/payment-intents/${intentId}`,
    { headers: headers() },
  );
  return r.json();
}

// ─── QR Instore ──────────────────────────────────────────────────────────────

export interface MpQRItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total_price: number;
}

export async function createQROrder(
  items: MpQRItem[],
  totalAmount: number,
  externalRef: string,
) {
  if (totalAmount < 15) {
    return { order_id: null, qr_image: null, message: 'El monto mínimo para pago QR es $15.00' };
  }

  const posId = envConfig.VITE_APP_MP_POS_EXTERNAL_ID;

  const r = await fetch(`${MP_BASE}/v1/orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      type: 'qr',
      total_amount: totalAmount.toFixed(2),
      description: 'Venta en tienda',
      external_reference: externalRef,
      expiration_time: 'PT10M',
      config: {
        qr: {
          external_pos_id: posId,
          mode: 'dynamic',
        },
      },
      transactions: {
        payments: [{ amount: totalAmount.toFixed(2) }],
      },
      items: items.map((it) => ({
        title: it.product_name,
        unit_price: it.price.toFixed(2),
        quantity: it.quantity,
        unit_measure: 'unit',
        external_code: String(it.product_id),
      })),
    }),
  });

  const data = (await r.json()) as {
    id?: string;
    type_response?: { qr_data?: string };
    [k: string]: unknown;
  };

  console.log("Create QR Order response:", r.status, JSON.stringify(data));

  const qrData = data.type_response?.qr_data;
  if (!data.id || !qrData) {
    return { ...data, order_id: null, qr_image: null };
  }

  const qr_image = await QRCode.toDataURL(qrData, { width: 280, margin: 2 });
  return { ...data, order_id: data.id, qr_image };
}

export async function checkQROrder(orderId: string) {
  const r = await fetch(`${MP_BASE}/v1/orders/${orderId}`, {
    headers: headers(),
  });
  return r.json();
}

export async function cancelQROrder(orderId: string) {
  const r = await fetch(`${MP_BASE}/v1/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: headers(),
  });
  if (r.status === 204) return { success: true };
  return r.json();
}

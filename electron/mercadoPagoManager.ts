import QRCode from 'qrcode';

const MP_BASE = 'https://api.mercadopago.com';

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
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
  const userId = process.env.MP_USER_ID;
  const posId = process.env.MP_POS_EXTERNAL_ID;

  const r = await fetch(
    `${MP_BASE}/instore/orders/qr/seller/collectors/${userId}/pos/${posId}/qrs`,
    {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        external_reference: externalRef,
        title: 'Venta',
        description: 'Compra en tienda',
        total_amount: totalAmount,
        items: items.map((it) => ({
          sku_number: String(it.product_id),
          category: 'marketplace',
          title: it.product_name,
          description: it.product_name,
          unit_price: it.price,
          quantity: it.quantity,
          unit_measure: 'unit',
          total_amount: it.total_price,
        })),
        cash_out: { amount: 0 },
      }),
    },
  );

  const data = (await r.json()) as { qr_data?: string; [k: string]: unknown };

  if (!data.qr_data) {
    return { ...data, qr_image: null };
  }

  const qr_image = await QRCode.toDataURL(data.qr_data as string, {
    width: 280,
    margin: 2,
  });

  return { ...data, qr_image };
}

export async function checkMerchantOrder(externalRef: string) {
  const r = await fetch(
    `${MP_BASE}/merchant_orders?external_reference=${encodeURIComponent(externalRef)}`,
    { headers: headers() },
  );
  return r.json();
}

export async function deleteQROrder() {
  const userId = process.env.MP_USER_ID;
  const posId = process.env.MP_POS_EXTERNAL_ID;
  const r = await fetch(
    `${MP_BASE}/instore/orders/qr/seller/collectors/${userId}/pos/${posId}/qrs`,
    { method: 'DELETE', headers: headers() },
  );
  if (r.status === 204) return { success: true };
  return r.json();
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';

const headers = () => ({
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export async function initializeTransaction({ email, amount, reference, callbackUrl, metadata }) {
  const body = JSON.stringify({ email, amount, reference, callback_url: callbackUrl, metadata });
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Paystack initialization failed');
  }
  return data.data;
}

export async function initializeMobileMoneyTransaction({ email, amount, reference, callbackUrl, phone, metadata = {} }) {
  const body = JSON.stringify({
    email,
    amount,
    reference,
    callback_url: callbackUrl,
    channel: 'mobile_money',
    phone,
    metadata: { ...metadata, phone },
  });
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Paystack mobile money initialization failed');
  }
  return data.data;
}

export async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    method: 'GET',
    headers: headers(),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Paystack verification failed');
  }
  return data.data;
}

export function hasPaystackConfig() {
  return Boolean(PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.trim().length > 0);
}

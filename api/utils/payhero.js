const PAYHERO_API = 'https://backend.payhero.co.ke';
const REQUEST_TIMEOUT_MS = 15_000;

export class PayHeroApiError extends Error {
  constructor(message, uncertain = false) {
    super(message);
    this.name = 'PayHeroApiError';
    this.uncertain = uncertain;
  }
}

export function getPayheroConfig() {
  const token = process.env.PAYHERO_BASIC_AUTH_TOKEN?.trim();
  const username = process.env.PAYHERO_API_USERNAME?.trim();
  const password = process.env.PAYHERO_API_PASSWORD;
  const channelValue = process.env.PAYHERO_CHANNEL_ID?.trim();
  const callbackValue = process.env.PAYHERO_CALLBACK_URL?.trim();

  const authorization = token
    ? (/^Basic\s/i.test(token) ? token : `Basic ${token}`)
    : username && password
      ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      : '';
  const channelId = /^\d+$/.test(channelValue || '') ? Number(channelValue) : NaN;

  if (!authorization || !Number.isSafeInteger(channelId) || channelId <= 0 || !callbackValue) {
    throw new Error('PayHero is not configured. Set PAYHERO_BASIC_AUTH_TOKEN, PAYHERO_CHANNEL_ID, and PAYHERO_CALLBACK_URL.');
  }

  let callbackUrl;
  try {
    callbackUrl = new URL(callbackValue);
  } catch {
    throw new Error('PAYHERO_CALLBACK_URL must be an absolute HTTPS URL.');
  }

  if (
    (callbackUrl.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && callbackUrl.hostname === 'localhost')) ||
    !callbackUrl.pathname.endsWith('/api/billing/webhook')
  ) {
    throw new Error('PAYHERO_CALLBACK_URL must use HTTPS and point to /api/billing/webhook.');
  }

  return {
    authorization,
    callbackUrl: callbackUrl.toString(),
    channelId,
  };
}

async function payheroRequest(path, { method = 'GET', body } = {}) {
  const { authorization } = getPayheroConfig();
  let response;

  try {
    response = await fetch(`${PAYHERO_API}${path}`, {
      method,
      headers: {
        Authorization: authorization,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new PayHeroApiError(
        'PayHero did not respond in time. Check payment status before retrying.',
        method === 'POST',
      );
    }
    throw new PayHeroApiError(
      'Unable to reach PayHero. Check the API connection and try again.',
      method === 'POST',
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new PayHeroApiError(
      'PayHero returned an invalid response.',
      method === 'POST' && (response.ok || response.status >= 500),
    );
  }

  if (!response.ok || (method === 'POST' && data?.success === false)) {
    const message = data?.error_message || data?.message;
    console.error('PayHero error:', data);
    throw new PayHeroApiError(
      typeof message === 'string' ? message.slice(0, 200) : `PayHero request failed with status ${response.status}.`,
      method === 'POST' && response.status >= 500,
    );
  }

  return data;
}

export async function initiatePayheroStkPush({
  amount,
  phoneNumber,
  externalReference,
  customerName,
}) {
  const { callbackUrl, channelId } = getPayheroConfig();
  const data = await payheroRequest('/api/v2/payments', {
    method: 'POST',
    body: {
      amount,
      phone_number: phoneNumber,
      channel_id: channelId,
      provider: 'm-pesa',
      external_reference: externalReference,
      customer_name: customerName,
      callback_url: callbackUrl,
    },
  });

  if (typeof data?.reference !== 'string' || !data.reference.trim()) {
    throw new PayHeroApiError('PayHero did not return a transaction reference.', true);
  }

  return data;
}

export async function getPayheroTransactionStatus(reference) {
  const query = new URLSearchParams({ reference });
  return payheroRequest(`/api/v2/transaction-status?${query.toString()}`);
}

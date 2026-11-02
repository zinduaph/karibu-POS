// Called once per reminder stage: 't-7', 't-3', 't-1', 'grace', 'blocked'.
export async function sendBillingNotice(restaurant, stage) {
  console.log(`[billing notice] ${restaurant.code}: ${stage}`);
  // TODO: look up the restaurant admin's email/phone and send through your provider
}
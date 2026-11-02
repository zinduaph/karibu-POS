// PLACEHOLDER PRICES: set your own, in whole KES. Yearly = 10 months for 12: a discount that also means fewer prompts to approve.
export const PLANS = {
  starter:  { name: 'Starter',  monthly: 1500, yearly: 15000 },
  standard: { name: 'Standard', monthly: 3000, yearly: 30000 },
  pro:      { name: 'Pro',      monthly: 5000, yearly: 50000 },
};
export const PLAN_CODES = Object.keys(PLANS);
export const priceFor = (plan, period) => PLANS[plan]?.[period];
export const publicPlans = () => Object.entries(PLANS).map(([code, p]) => ({ code, ...p }));
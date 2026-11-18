// PLACEHOLDER PRICES: set your own, in whole KES. Yearly = 10 months for 12: a discount that also means fewer prompts to approve.
export const PLANS = {
  starter:  { name: 'Starter',  monthly: 2315, yearly: 27780 },
  standard: { name: 'Standard', monthly: 3520, yearly: 42240 },
  pro:      { name: 'Pro',      monthly: 5000, yearly: 50000 },
};
export const PLAN_CODES = Object.keys(PLANS);
export const priceFor = (plan, period) => PLANS[plan]?.[period];
export const publicPlans = () => Object.entries(PLANS).map(([code, p]) => ({ code, ...p }));
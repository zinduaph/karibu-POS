import { z } from 'zod';
import { PLAN_CODES } from '../config/plans.js';

// The client chooses WHICH plan and period. The price is never part of the request.
export const checkout = z.object({
  plan: z.enum(PLAN_CODES),
  period: z.enum(['monthly', 'yearly']),
  phone: z.string().trim().min(9).max(15),
});
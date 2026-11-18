import { z } from 'zod';
import { PLAN_CODES } from '../config/plans.js';

// The client chooses WHICH plan and period. The price is never part of the request.
export const checkout = z.object({
  plan: z.enum(PLAN_CODES),
  period: z.enum(['monthly', 'yearly']),
  phone: z.string().trim().regex(/^(07\d{8}|2547\d{8})$/),
});

export const invoiceStatusParams = z.object({
  id: z.string().regex(/^(?:[a-f\d]{24}|sub-[a-f\d-]{36})$/i),
});
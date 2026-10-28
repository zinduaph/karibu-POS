import { z } from 'zod';
import { isWeakPin } from '../utils/credentials.js';

const pin = z.string().regex(/^\d{6}$/);
const newPin = pin.refine((p) => !isWeakPin(p));

export const adminLogin = z.object({
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

export const cashierLogin = z.object({
  restaurantCode: z.string().min(1).max(20).transform((s) => s.trim().toUpperCase()),
  username: z.string().min(1).max(40).transform((s) => s.trim().toLowerCase()),
  pin,
});

export const unlock = z.object({ pin });

export const changePin = z
  .object({ currentPin: pin, newPin })
  .refine((d) => d.currentPin !== d.newPin);

export const changePassword = z
  .object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(12).max(200) })
  .refine((d) => d.currentPassword !== d.newPassword);
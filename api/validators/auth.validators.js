import { z } from 'zod';

export const adminLogin = z.object({
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

export const cashierLogin = z.object({
  restaurantCode: z.string().min(1).max(20).transform((s) => s.trim().toUpperCase()),
  username: z.string().min(1).max(40).transform((s) => s.trim().toLowerCase()),
  pin: z.string().min(1).max(20),
});

export const unlock = z.object({ pin: z.string().min(1).max(20) });

export const changePin = z
  .object({ currentPin: z.string().min(1).max(20), newPin: z.string().min(1).max(20) })
  .refine((d) => d.currentPin !== d.newPin);

export const changePassword = z
  .object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(12).max(200) })
  .refine((d) => d.currentPassword !== d.newPassword);
import { z } from 'zod';

export const onboardingStatus = z.object({});

export const adminChangePassword = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12).max(200),
});

export const updateRestaurantDetails = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().min(1).max(200).optional(),
  contactInfo: z.string().trim().min(1).max(200).optional(),
  logo: z.string().trim().url().optional().or(z.literal('')),
});

export const addProduct = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.number().positive(),
  category: z.enum(['food', 'drink']).default('food'),
  stockQuantity: z.number().int().nonnegative(),
});

export const updateProduct = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  price: z.number().positive().optional(),
  category: z.enum(['food', 'drink']).optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
});

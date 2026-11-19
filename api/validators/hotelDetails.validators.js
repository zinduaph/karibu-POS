import { z } from 'zod';

export const saveHotelDetails = z.object({
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(200),
  customerCareNumber: z.string().trim().min(1).max(40),
  hotelEmail: z.union([
    z.string().trim().max(254).email(),
    z.literal(''),
  ]).optional().default(''),
});

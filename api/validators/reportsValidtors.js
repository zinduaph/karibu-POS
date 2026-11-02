import { z } from 'zod';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)));

export const overviewQuery = z
  .object({ from: day.optional(), to: day.optional() })
  .refine((q) => (q.from === undefined) === (q.to === undefined))                    // both dates or neither
  .refine((q) => !q.from || q.from <= q.to)                                           // from is not after to
  .refine((q) => !q.from || (Date.parse(q.to) - Date.parse(q.from)) / 864e5 < 366);  // at most one year
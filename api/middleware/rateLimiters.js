import rateLimit from 'express-rate-limit';

// Login limiter - 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many registration attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
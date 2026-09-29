import { z } from 'zod';
import { ROLES } from '../models/User.js';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim(),
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8).max(128),
    orgName: z.string().min(2).max(100).trim(),
    siteName: z.string().trim().max(100).optional().or(z.literal('')),
    role: z.enum(ROLES).default('reporter'),
    language: z.enum(['en', 'es', 'fr']).default('en'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
});
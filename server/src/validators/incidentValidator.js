import { z } from 'zod';

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['injury', 'near_miss', 'hazard']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    siteId: z.string().min(1, 'Site ID is required'),
    // attachments are handled via multer, not strictly validated here
  }),
});

export const listIncidentsSchema = z.object({
  query: z.object({
    status: z.enum(['reported', 'investigating', 'action_pending', 'closed']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    siteId: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(10),
  }),
});

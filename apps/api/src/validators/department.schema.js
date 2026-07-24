import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required'),
  code: z.string().trim().min(1, 'Department code is required'),
  head_id: z.number().int().positive().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  head_id: z.number().int().positive().optional().nullable(),
});

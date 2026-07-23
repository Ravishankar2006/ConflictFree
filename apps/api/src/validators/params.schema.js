import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid ID'),
});

export const courseIdParamSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

export const courseFacultyParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  facultyId: z.coerce.number().int().positive(),
});

export const facultyIdParamSchema = z.object({
  facultyId: z.coerce.number().int().positive(),
});

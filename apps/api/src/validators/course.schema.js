import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().trim().min(1, 'Course name is required'),
  code: z.string().trim().min(1, 'Course code is required'),
});

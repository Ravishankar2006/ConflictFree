import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  student_id: z.number().int().positive('student_id is required'),
  course_id: z.number().int().positive('course_id is required'),
});

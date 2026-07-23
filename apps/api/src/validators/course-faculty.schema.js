import { z } from 'zod';

export const assignFacultySchema = z.object({
  faculty_id: z.number().int().positive('faculty_id is required'),
});

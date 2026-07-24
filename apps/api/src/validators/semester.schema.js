import { z } from 'zod';

const terms = ['FALL', 'SPRING', 'SUMMER'];

export const createSemesterSchema = z.object({
  name: z.string().trim().min(1, 'Semester name is required'),
  academic_year: z.string().trim().min(1, 'Academic year is required'),
  term: z.enum(terms, { message: `Term must be one of: ${terms.join(', ')}` }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD'),
  is_active: z.boolean().optional(),
}).refine(data => data.end_date > data.start_date, {
  message: 'end_date must be after start_date',
  path: ['end_date'],
});

export const updateSemesterSchema = z.object({
  name: z.string().trim().min(1).optional(),
  academic_year: z.string().trim().min(1).optional(),
  term: z.enum(terms).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_active: z.boolean().optional(),
});

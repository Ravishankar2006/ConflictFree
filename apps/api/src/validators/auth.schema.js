import { z } from 'zod';

const roles = ['student', 'faculty', 'admin']  ;

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(roles, { message: `Role must be one of: ${roles.join(', ')}` }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = registerSchema;

export const listUsersSchema = z.object({
  role: z.enum(roles, { message: `Invalid role filter. Use one of: ${roles.join(', ')}` }).optional(),
  department_id: z.coerce.number().int().positive().optional(),
});

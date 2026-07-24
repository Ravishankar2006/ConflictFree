import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required'),
  department_id: z.number().int().positive('Department is required'),
  home_room_id: z.number().int().positive('Home room is required'),
});

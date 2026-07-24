import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required'),
  capacity: z.number().int().positive().optional(),
  is_lab: z.boolean().optional(),
});

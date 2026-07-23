import { z } from 'zod';

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const createSlotSchema = z.object({
  course_id: z.number().int().positive(),
  room: z.string().trim().min(1, 'Room is required'),
  faculty_id: z.number().int().positive(),
  day: z.enum(days),
  start_time: z.string().regex(timeRegex, 'start_time must be in HH:mm format'),
  end_time: z.string().regex(timeRegex, 'end_time must be in HH:mm format'),
}).refine(data => data.end_time > data.start_time, {
  message: 'end_time must be after start_time',
  path: ['end_time'],
});

export const updateSlotSchema = createSlotSchema;

export const applySlotsSchema = z.object({
  clearExisting: z.boolean().optional(),
  slots: z.array(z.object({
    course_id: z.number().int().positive(),
    faculty_id: z.number().int().positive(),
    room: z.string().trim().min(1),
    day: z.enum(days),
    start_time: z.string().regex(timeRegex),
    end_time: z.string().regex(timeRegex),
  }).refine(data => data.end_time > data.start_time, {
    message: 'end_time must be after start_time',
    path: ['end_time'],
  })).min(1, 'At least one slot is required'),
});

import { Router } from 'express';
import { createSlot, getMyTimetable, getAllSlots, deleteSlot, updateSlot, exportIcal } from '../controllers/timetable.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { createSlotSchema, updateSlotSchema } from '../validators/timetable.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/me', verifyToken, getMyTimetable);
router.get('/export/ical', verifyToken, exportIcal);
router.get('/slots', verifyToken, requireRole('admin'), getAllSlots);
router.post('/slots', verifyToken, requireRole('admin'), validate(createSlotSchema), createSlot);
router.patch('/slots/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), validate(updateSlotSchema), updateSlot);
router.delete('/slots/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteSlot);

export default router;

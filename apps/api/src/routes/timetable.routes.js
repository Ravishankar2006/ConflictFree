import { Router } from 'express';
import { createSlot, getMyTimetable, getAllSlots, deleteSlot, updateSlot, exportIcal } from '../controllers/timetable.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Get my timetable (any authenticated user)
router.get('/me', verifyToken, getMyTimetable);

// Export my timetable as iCal
router.get('/export/ical', verifyToken, exportIcal);

// Get all slots (admin only)
router.get('/slots', verifyToken, requireRole('admin'), getAllSlots);

// Create a new timetable slot (ADMIN ONLY)
router.post('/slots', verifyToken, requireRole('admin'), createSlot);

// Update (reschedule) a timetable slot (ADMIN ONLY)
router.patch('/slots/:id', verifyToken, requireRole('admin'), updateSlot);

// Delete a timetable slot (ADMIN ONLY)
router.delete('/slots/:id', verifyToken, requireRole('admin'), deleteSlot);

export default router;

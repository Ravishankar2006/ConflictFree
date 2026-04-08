import { Router } from 'express';
import { createSlot, getMyTimetable, getAllSlots, deleteSlot } from '../controllers/timetable.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Get my timetable (any authenticated user)
router.get('/me', verifyToken, getMyTimetable);

// Get all slots (admin only)
router.get('/slots', verifyToken, requireRole('admin'), getAllSlots);

// Create a new timetable slot (ADMIN ONLY)
router.post('/slots', verifyToken, requireRole('admin'), createSlot);

// Delete a timetable slot (ADMIN ONLY)
router.delete('/slots/:id', verifyToken, requireRole('admin'), deleteSlot);

export default router;

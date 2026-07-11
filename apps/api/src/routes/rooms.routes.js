import { Router } from 'express';
import { listRooms, createRoom, deleteRoom } from '../controllers/rooms.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, listRooms);
router.post('/', verifyToken, requireRole('admin'), createRoom);
router.delete('/:id', verifyToken, requireRole('admin'), deleteRoom);

export default router;

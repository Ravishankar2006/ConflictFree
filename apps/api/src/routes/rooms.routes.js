import { Router } from 'express';
import { listRooms, createRoom, deleteRoom } from '../controllers/rooms.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { createRoomSchema } from '../validators/room.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, listRooms);
router.post('/', verifyToken, requireRole('admin'), validate(createRoomSchema), createRoom);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteRoom);

export default router;

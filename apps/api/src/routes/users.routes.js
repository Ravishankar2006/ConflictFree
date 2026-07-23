import { Router } from 'express';
import { listUsers, createUser, deleteUser } from '../controllers/auth.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { createUserSchema, listUsersSchema } from '../validators/auth.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), validateQuery(listUsersSchema), listUsers);
router.post('/', verifyToken, requireRole('admin'), validate(createUserSchema), createUser);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteUser);

export default router;

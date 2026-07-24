import { Router } from 'express';
import { listClasses, createClass, deleteClass } from '../controllers/classes.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { createClassSchema } from '../validators/class.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, listClasses);
router.post('/', verifyToken, requireRole('admin'), validate(createClassSchema), createClass);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteClass);

export default router;

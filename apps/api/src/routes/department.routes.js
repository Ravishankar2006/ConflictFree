import { Router } from 'express';
import { listDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, listDepartments);
router.post('/', verifyToken, requireRole('admin'), validate(createDepartmentSchema), createDepartment);
router.patch('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), validate(updateDepartmentSchema), updateDepartment);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteDepartment);

export default router;

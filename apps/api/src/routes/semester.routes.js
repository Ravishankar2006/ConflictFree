import { Router } from 'express';
import { listSemesters, createSemester, updateSemester, deleteSemester } from '../controllers/semester.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { createSemesterSchema, updateSemesterSchema } from '../validators/semester.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, listSemesters);
router.post('/', verifyToken, requireRole('admin'), validate(createSemesterSchema), createSemester);
router.patch('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), validate(updateSemesterSchema), updateSemester);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteSemester);

export default router;

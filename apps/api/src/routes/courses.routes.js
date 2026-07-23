import { Router } from 'express';
import { listCourses, createCourse, deleteCourse } from '../controllers/courses.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { createCourseSchema } from '../validators/course.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, listCourses);
router.post('/', verifyToken, requireRole('admin'), validate(createCourseSchema), createCourse);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteCourse);

export default router;

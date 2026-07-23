import { Router } from 'express';
import { getCourseFaculty, getAllAssignments, assignFaculty, removeFaculty } from '../controllers/course-faculty.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { assignFacultySchema } from '../validators/course-faculty.schema.js';
import { courseIdParamSchema, courseFacultyParamsSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), getAllAssignments);
router.get('/:courseId', verifyToken, requireRole('admin'), validateParams(courseIdParamSchema), getCourseFaculty);
router.post('/:courseId', verifyToken, requireRole('admin'), validateParams(courseIdParamSchema), validate(assignFacultySchema), assignFaculty);
router.delete('/:courseId/:facultyId', verifyToken, requireRole('admin'), validateParams(courseFacultyParamsSchema), removeFaculty);

export default router;

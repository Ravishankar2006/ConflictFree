import { Router } from 'express';
import { getCourseFaculty, getAllAssignments, assignFaculty, removeFaculty } from '../controllers/course-faculty.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), getAllAssignments);
router.get('/:courseId', verifyToken, requireRole('admin'), getCourseFaculty);
router.post('/:courseId', verifyToken, requireRole('admin'), assignFaculty);
router.delete('/:courseId/:facultyId', verifyToken, requireRole('admin'), removeFaculty);

export default router;

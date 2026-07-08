import { Router } from 'express';
import { listCourses, createCourse, deleteCourse } from '../controllers/courses.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Any authenticated user can view courses (needed for dropdowns)
router.get('/', verifyToken, listCourses);

// Admin only: create / delete courses
router.post('/', verifyToken, requireRole('admin'), createCourse);
router.delete('/:id', verifyToken, requireRole('admin'), deleteCourse);

export default router;

import { Router } from 'express';
import { register, login, listUsers, createUser, deleteUser } from '../controllers/auth.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', verifyToken, requireRole('admin'), listUsers);
router.post('/users', verifyToken, requireRole('admin'), createUser);
router.delete('/users/:id', verifyToken, requireRole('admin'), deleteUser);

export default router;

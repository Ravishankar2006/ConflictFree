import { Router } from 'express';
import { register, login, listUsers } from '../controllers/auth.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', verifyToken, requireRole('admin'), listUsers);

export default router;

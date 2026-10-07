import express from 'express';
import { getUsers, getRoles, updateUserRole, updateRoleSchema } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

// Any authenticated user can view users and roles for assignment
router.get('/', getUsers);
router.get('/roles', getRoles);

// Only Admin can update roles
router.patch('/:id/role', requireAdmin, validate(updateRoleSchema), updateUserRole);

export default router;


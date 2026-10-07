import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  createTaskSchema,
  updateTaskSchema,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { requireLeaderOrAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

// View tasks (scoped by user role)
router.get('/', getTasks);
router.get('/:id', getTaskById);

// Only Project Leaders and Admins can create tasks
router.post('/', requireLeaderOrAdmin, validate(createTaskSchema), createTask);

// Update task: Members can update status of their assigned tasks; Leaders/Admins can edit details
router.put('/:id', validate(updateTaskSchema), updateTask);

// Only Project Leaders and Admins can delete tasks
router.delete('/:id', requireLeaderOrAdmin, deleteTask);

export default router;

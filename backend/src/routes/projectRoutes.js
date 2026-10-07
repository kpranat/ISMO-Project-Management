import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  createProjectSchema,
  updateProjectSchema,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { requireLeaderOrAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

// View projects (scoped by role inside controller)
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Only Project Leaders and Admins can create, edit, or delete projects
router.post('/', requireLeaderOrAdmin, validate(createProjectSchema), createProject);
router.put('/:id', requireLeaderOrAdmin, validate(updateProjectSchema), updateProject);
router.delete('/:id', requireLeaderOrAdmin, deleteProject);

export default router;

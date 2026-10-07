import express from 'express';
import { getUpdates } from '../controllers/updateController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getUpdates);

export default router;


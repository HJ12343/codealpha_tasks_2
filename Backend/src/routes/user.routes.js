import express from 'express';
import {
  searchUsers,
  getUserProfile,
  updateProfile,
  toggleFollow,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, searchUsers);
router.get('/profile/:username', authenticate, getUserProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/:id/follow', authenticate, toggleFollow);

export default router;

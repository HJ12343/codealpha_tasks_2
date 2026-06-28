import express from 'express';
import {
  getFeed,
  createPost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} from '../controllers/post.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getFeed);
router.post('/', authenticate, createPost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comments', authenticate, addComment);
router.delete('/comments/:id', authenticate, deleteComment);

export default router;

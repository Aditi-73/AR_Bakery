import express from 'express';
import { 
  createComment, 
  getComments, 
  updateComment, 
  deleteComment, 
  likeComment 
} from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getComments);

// Protected routes
router.post('/', authMiddleware, createComment);
router.put('/:id', authMiddleware, updateComment);
router.delete('/:id', authMiddleware, deleteComment);
router.post('/:id/like', authMiddleware, likeComment);

export default router;
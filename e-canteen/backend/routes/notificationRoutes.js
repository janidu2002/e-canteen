import express from 'express';
import {
  getNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.get('/', protect, authorize('admin'), getNotifications);
router.get('/my-notifications', protect, getUserNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

export default router;

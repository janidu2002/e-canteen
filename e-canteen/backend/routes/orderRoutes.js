import express from 'express';
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, orderSchema, orderStatusSchema } from '../validations/schemas.js';

const router = express.Router();

// Student routes
router.post('/', protect, authorize('student'), validate(orderSchema), createOrder);
router.get('/my-orders', protect, getMyOrders);

// Admin routes
router.get('/', protect, authorize('admin'), getAllOrders);
router.get('/stats', protect, authorize('admin'), getOrderStats);

// Shared routes (with authorization check in controller)
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('admin'), validate(orderStatusSchema), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

export default router;

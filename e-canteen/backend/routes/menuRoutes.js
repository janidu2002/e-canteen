import express from 'express';
import {
  getMenuItems,
  getMenuItem,
  getRecentItems,
  getLowStockItems,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getMenuItems);
router.get('/recent', getRecentItems);
router.get('/categories', getCategories);
router.get('/:id', getMenuItem);

// Admin protected routes
router.get('/admin/low-stock', protect, authorize('admin'), getLowStockItems);

router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  handleUploadError,
  createMenuItem
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  handleUploadError,
  updateMenuItem
);

router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

export default router;

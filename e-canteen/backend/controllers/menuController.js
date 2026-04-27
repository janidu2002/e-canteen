import MenuItem from '../models/MenuItem.js';
import Notification from '../models/Notification.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
export const getMenuItems = async (req, res, next) => {
  try {
    const { search, category, available, sort = '-createdAt', limit = 50, page = 1 } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (available === 'true') {
      query.isAvailable = true;
      query.stock = { $gt: 0 };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      MenuItem.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
export const getMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent menu items (for student home page)
// @route   GET /api/menu/recent
// @access  Public
export const getRecentItems = async (req, res, next) => {
  try {
    const items = await MenuItem.find({ isAvailable: true, stock: { $gt: 0 } })
      .sort('-createdAt')
      .limit(4);

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock items
// @route   GET /api/menu/low-stock
// @access  Private/Admin
export const getLowStockItems = async (req, res, next) => {
  try {
    const items = await MenuItem.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).sort('stock');

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get menu categories
// @route   GET /api/menu/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'];
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private/Admin
export const createMenuItem = async (req, res, next) => {
  try {
    const { name, price, category, stock, lowStockThreshold, description } = req.body;

    // Handle image upload
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const item = await MenuItem.create({
      name,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      lowStockThreshold: parseInt(lowStockThreshold),
      description,
      image: imagePath
    });

    // Check for low stock notification
    if (item.stock <= item.lowStockThreshold) {
      await Notification.create({
        type: 'low-stock',
        title: 'Low Stock Alert',
        message: `${item.name} is low on stock (${item.stock} remaining)`,
        relatedMenuItem: item._id,
        forAdmin: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin
export const updateMenuItem = async (req, res, next) => {
  try {
    let item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const { name, price, category, stock, lowStockThreshold, description, isAvailable } = req.body;

    // Handle image update
    let imagePath = item.image;
    if (req.file) {
      // Delete old image if exists
      if (item.image) {
        const oldImagePath = path.join(__dirname, '..', item.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Update item
    item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        name: name || item.name,
        price: price !== undefined ? parseFloat(price) : item.price,
        category: category || item.category,
        stock: stock !== undefined ? parseInt(stock) : item.stock,
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : item.lowStockThreshold,
        description: description !== undefined ? description : item.description,
        image: imagePath,
        isAvailable: isAvailable !== undefined ? isAvailable : item.isAvailable
      },
      { new: true, runValidators: true }
    );

    // Check for low stock notification
    if (item.stock <= item.lowStockThreshold) {
      const existingNotification = await Notification.findOne({
        relatedMenuItem: item._id,
        type: 'low-stock',
        isRead: false
      });

      if (!existingNotification) {
        await Notification.create({
          type: 'low-stock',
          title: 'Low Stock Alert',
          message: `${item.name} is low on stock (${item.stock} remaining)`,
          relatedMenuItem: item._id,
          forAdmin: true
        });
      }
    }

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
export const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Delete image if exists
    if (item.image) {
      const imagePath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMenuItems,
  getMenuItem,
  getRecentItems,
  getLowStockItems,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};

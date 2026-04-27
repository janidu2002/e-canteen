import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Notification from '../models/Notification.js';
import { sendOrderConfirmationEmail, sendOrderCompletionEmail } from '../services/emailService.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Student
export const createOrder = async (req, res, next) => {
  try {
    const { items, pickupDate, pickupTime, specialInstructions, paymentMethod, paymentId, paymentStatus } = req.validatedData;
    const user = req.user;

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item not found: ${item.menuItem}`
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable`
        });
      }

      if (menuItem.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.stock}`
        });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        image: menuItem.image
      });

      totalAmount += menuItem.price * item.quantity;

      // Update stock
      menuItem.stock -= item.quantity;
      await menuItem.save();

      // Check for low stock notification
      if (menuItem.stock <= menuItem.lowStockThreshold) {
        const existingNotification = await Notification.findOne({
          relatedMenuItem: menuItem._id,
          type: 'low-stock',
          isRead: false
        });

        if (!existingNotification) {
          await Notification.create({
            type: 'low-stock',
            title: 'Low Stock Alert',
            message: `${menuItem.name} is low on stock (${menuItem.stock} remaining)`,
            relatedMenuItem: menuItem._id,
            forAdmin: true
          });
        }
      }
    }

    // Create order with pickup details and payment info
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      totalAmount,
      pickupDate: new Date(pickupDate),
      pickupTime,
      specialInstructions,
      paymentMethod,
      paymentId,
      paymentStatus,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone
    });

    // Create notification for admin
    await Notification.create({
      type: 'new-order',
      title: 'New Order Received',
      message: `New order #${order.orderNumber} from ${user.name} - Rs. ${totalAmount.toFixed(2)} (Pickup: ${pickupTime})`,
      relatedOrder: order._id,
      forAdmin: true
    });

    // Send order confirmation email to student (async, don't wait)
    sendOrderConfirmationEmail(order).catch(err => {
      console.error('Failed to send confirmation email:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, sort = '-createdAt', limit = 50, page = 1 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
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

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private/Student
export const getMyOrders = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.validatedData;

    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousStatus = order.status;
    
    // Update status
    order.status = status;
    await order.save();

    // Create notification for user
    await Notification.create({
      type: 'order-status',
      title: 'Order Status Updated',
      message: `Your order #${order.orderNumber} is now ${status.replace('-', ' ')}`,
      relatedOrder: order._id,
      forAdmin: false,
      forUser: order.user
    });

    // Send completion email when status changes to 'completed'
    if (status === 'ready' && previousStatus !== 'ready' && !order.completionEmailSent) {
      try {
        await sendOrderCompletionEmail(order);
        // Mark email as sent
        order.completionEmailSent = true;
        await order.save();
      } catch (emailError) {
        console.error('Failed to send completion email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow cancellation if order is pending
    if (order.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Order can only be cancelled when pending'
      });
    }

    // Check authorization for students
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Restore stock
    for (const item of order.items) {
      await MenuItem.findByIdAndUpdate(item.menuItem, {
        $inc: { stock: item.quantity }
      });
    }

    // Update status
    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order statistics (Admin Dashboard)
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      monthOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      statusCounts
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Get daily orders for last 7 days (for chart)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date);
    }

    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days[0] },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        monthOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        dailyOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
};

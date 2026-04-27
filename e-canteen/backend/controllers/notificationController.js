import Notification from '../models/Notification.js';

// @desc    Get admin notifications
// @route   GET /api/notifications
// @access  Private/Admin
export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly = 'false', limit = 50, page = 1 } = req.query;

    const query = { forAdmin: true };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('relatedOrder', 'orderNumber totalAmount')
        .populate('relatedMenuItem', 'name stock'),
      Notification.countDocuments(query),
      Notification.countDocuments({ forAdmin: true, isRead: false })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

// @desc    Get user notifications
// @route   GET /api/notifications/my-notifications
// @access  Private
export const getUserNotifications = async (req, res, next) => {
  try {
    const { unreadOnly = 'false', limit = 20 } = req.query;

    const query = { forUser: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort('-createdAt')
        .limit(parseInt(limit))
        .populate('relatedOrder', 'orderNumber status'),
      Notification.countDocuments({ forUser: req.user._id, isRead: false })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check authorization
    if (notification.forAdmin && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (notification.forUser && notification.forUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' 
      ? { forAdmin: true, isRead: false }
      : { forUser: req.user._id, isRead: false };

    await Notification.updateMany(query, { isRead: true });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? { forAdmin: true, isRead: false }
      : { forUser: req.user._id, isRead: false };

    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};

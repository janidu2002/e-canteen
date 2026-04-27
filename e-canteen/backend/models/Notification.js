import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['new-order', 'low-stock', 'order-status'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedMenuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  forAdmin: {
    type: Boolean,
    default: true
  },
  forUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ forAdmin: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  image: {
    type: String
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [items => items.length > 0, 'Order must have at least one item']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Pickup details (replacing delivery)
  pickupDate: {
    type: Date,
    required: [true, 'Pickup date is required']
  },
  pickupTime: {
    type: String,
    required: [true, 'Pickup time is required']
  },
  specialInstructions: {
    type: String,
    maxlength: [200, 'Special instructions must be less than 200 characters']
  },
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['card'],
    default: 'card',
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  // Customer details
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  // Email tracking
  completionEmailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Add initial status to history
  if (this.isNew) {
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date()
    }];
  }
  
  next();
});

// Update status history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

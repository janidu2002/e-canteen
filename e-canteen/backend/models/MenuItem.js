import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must be less than 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'],
    default: 'Snacks'
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    required: [true, 'Low stock threshold is required'],
    min: [0, 'Threshold cannot be negative'],
    default: 10
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be less than 500 characters']
  },
  image: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual to check if stock is low
menuItemSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold;
});

// Ensure virtuals are included in JSON output
menuItemSchema.set('toJSON', { virtuals: true });
menuItemSchema.set('toObject', { virtuals: true });

// Index for search functionality
menuItemSchema.index({ name: 'text', description: 'text' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;

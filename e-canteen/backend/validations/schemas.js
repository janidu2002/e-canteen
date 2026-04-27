import { z } from 'zod';

// Sri Lankan phone number regex: +94XXXXXXXXX, 0XXXXXXXXX, or XXXXXXXXX (9 digits)
const sriLankanPhoneRegex = /^(?:\+94|0)?[0-9]{9}$/;

// User Registration Schema (Student)
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z.string()
    .email('Invalid email address'),
  phone: z.string()
    .regex(sriLankanPhoneRegex, 'Invalid Sri Lankan phone number (e.g., +94771234567, 0771234567)'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters'),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required'),
});

// Menu Item Schema
export const menuItemSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  price: z.number()
    .positive('Price must be greater than 0')
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => val > 0, 'Price must be greater than 0'),
  category: z.string()
    .min(1, 'Category is required'),
  stock: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .or(z.string().transform((val) => parseInt(val, 10)))
    .refine((val) => val >= 0, 'Stock cannot be negative'),
  lowStockThreshold: z.number()
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative')
    .or(z.string().transform((val) => parseInt(val, 10)))
    .refine((val) => val >= 0, 'Threshold cannot be negative'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

// Order Item Schema
const orderItemSchema = z.object({
  menuItem: z.string().min(1, 'Menu item is required'),
  name: z.string().min(1, 'Item name is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  image: z.string().optional(),
});

// Order Schema (updated for pickup)
export const orderSchema = z.object({
  items: z.array(orderItemSchema)
    .min(1, 'At least one item is required'),
  pickupDate: z.string()
    .min(1, 'Pickup date is required')
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Pickup date must be today or later'),
  pickupTime: z.string()
    .min(1, 'Pickup time is required')
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  specialInstructions: z.string()
    .max(200, 'Special instructions must be less than 200 characters')
    .optional(),
  paymentMethod: z.enum(['card'], {
    errorMap: () => ({ message: 'Payment method must be card' })
  }),
  paymentId: z.string()
    .min(1, 'Payment ID is required'),
  paymentStatus: z.enum(['completed'], {
    errorMap: () => ({ message: 'Payment must be completed' })
  }),
});

// Order Status Update Schema
export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid order status' })
  }),
});

// Validate request middleware factory
export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    req.validatedData = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  registerSchema,
  loginSchema,
  menuItemSchema,
  orderSchema,
  orderStatusSchema,
  validate
};

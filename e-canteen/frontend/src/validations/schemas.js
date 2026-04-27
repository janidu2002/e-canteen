import { z } from 'zod';

// Sri Lankan phone number regex: +94xxxxxxxxx, 0xxxxxxxxx, or xxxxxxxxx (9 digits)
const sriLankanPhoneRegex = /^(?:\+94|0)?[0-9]{9}$/;

// Auth Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(sriLankanPhoneRegex, 'Invalid Sri Lankan phone number (e.g., 0771234567 or +94771234567)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Menu Item Schema
export const menuItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0.01, 'Price must be greater than 0'),
  category: z
    .enum(['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'], {
      errorMap: () => ({ message: 'Please select a category' }),
    }),
  stock: z
    .number({ invalid_type_error: 'Stock must be a number' })
    .min(0, 'Stock cannot be negative')
    .int('Stock must be a whole number'),
  lowStockThreshold: z
    .number({ invalid_type_error: 'Threshold must be a number' })
    .min(0, 'Threshold cannot be negative')
    .int('Threshold must be a whole number'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isAvailable: z.boolean().optional().default(true),
});

// Order Schema
export const orderSchema = z.object({
  items: z
    .array(z.object({
      menuItem: z.string(),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
    }))
    .min(1, 'Order must have at least one item'),
  pickupDate: z
    .string()
    .min(1, 'Pickup date is required'),
  pickupTime: z
    .string()
    .min(1, 'Pickup time is required'),
  specialInstructions: z
    .string()
    .max(200, 'Instructions must be less than 200 characters')
    .optional(),
  paymentMethod: z
    .enum(['card'], {
      errorMap: () => ({ message: 'Card payment is required' }),
    }),
});

// Checkout Schema (pickup-based with payment)
export const checkoutSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Name is required'),
  customerEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  customerPhone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(sriLankanPhoneRegex, 'Invalid Sri Lankan phone number'),
  pickupDate: z
    .string()
    .min(1, 'Pickup date is required')
    .refine((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, 'Pickup date must be today or later'),
  pickupTime: z
    .string()
    .min(1, 'Pickup time is required')
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  specialInstructions: z
    .string()
    .max(200, 'Instructions must be less than 200 characters')
    .optional(),
});

// Payment Form Schema (mock gateway)
export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^[0-9]{16}$/, 'Card number must be 16 digits'),
  cardHolder: z
    .string()
    .min(1, 'Cardholder name is required')
    .min(3, 'Cardholder name must be at least 3 characters'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Invalid format (MM/YY)')
    .refine((val) => {
      const [month, year] = val.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      return expiry > new Date();
    }, 'Card has expired'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^[0-9]{3,4}$/, 'CVV must be 3-4 digits'),
});

// Order Status Schema
export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  note: z.string().optional(),
});

// Menu categories list
export const MENU_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'];

// Order status list (updated for pickup flow)
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'preparing', label: 'Preparing', color: 'bg-blue-500' },
  { value: 'ready', label: 'Ready for Pickup', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

// Pickup time slots
export const PICKUP_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00'
];

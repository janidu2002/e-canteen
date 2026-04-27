import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Clock, Calendar, ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderAPI } from '../../api/axios';
import { checkoutSchema, paymentSchema, PICKUP_TIME_SLOTS } from '../../validations/schemas';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_BASE_URL = 'http://localhost:5000';

// Checkout steps
const STEPS = {
  CART: 'cart',
  DETAILS: 'details',
  PAYMENT: 'payment',
  PROCESSING: 'processing',
  SUCCESS: 'success',
};

const CartSheet = ({ open, onOpenChange }) => {
  const { user, isAuthenticated } = useAuth();
  const { items, totalItems, totalAmount, updateQuantity, removeItem, clearCart, getOrderItems } = useCart();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.CART);
  const [checkoutData, setCheckoutData] = useState(null);

  // Checkout form
  const checkoutForm = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      pickupDate: '',
      pickupTime: '',
      specialInstructions: '',
    },
  });

  // Payment form
  const paymentForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
    },
  });

  // Pre-fill user data when user changes or step changes
  useEffect(() => {
    if (user && currentStep === STEPS.DETAILS) {
      checkoutForm.setValue('customerName', user.name || '');
      checkoutForm.setValue('customerEmail', user.email || '');
      checkoutForm.setValue('customerPhone', user.phone || '');
    }
  }, [user, currentStep, checkoutForm]);

  // Reset forms when sheet closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCurrentStep(STEPS.CART);
        checkoutForm.reset();
        paymentForm.reset();
        setCheckoutData(null);
      }, 300);
    }
  }, [open, checkoutForm, paymentForm]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to place an order');
      onOpenChange(false);
      navigate('/login');
      return;
    }
    setCurrentStep(STEPS.DETAILS);
  };

  const handleCheckoutSubmit = (data) => {
    setCheckoutData(data);
    setCurrentStep(STEPS.PAYMENT);
  };

  const handlePaymentSubmit = async (paymentData) => {
    setCurrentStep(STEPS.PROCESSING);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Generate mock payment ID
      const mockPaymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const orderData = {
        items: getOrderItems(),
        pickupDate: checkoutData.pickupDate,
        pickupTime: checkoutData.pickupTime,
        specialInstructions: checkoutData.specialInstructions || '',
        paymentMethod: 'card',
        paymentId: mockPaymentId,
        paymentStatus: 'completed',
      };

      await orderAPI.create(orderData);
      
      setCurrentStep(STEPS.SUCCESS);
      clearCart();

      // Auto close and redirect after 3 seconds
      setTimeout(() => {
        onOpenChange(false);
        navigate('/my-orders');
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      setCurrentStep(STEPS.PAYMENT);
    }
  };

  const formatPrice = (price) => {
    return `Rs. ${price.toFixed(2)}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Render cart items
  const renderCartItems = () => (
    <>
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-4 py-4">
          {items.map((item) => (
            <div key={item._id} className="flex gap-4">
              <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {item.image ? (
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.price)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                    onClick={() => removeItem(item._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t pt-4 space-y-4 px-6 mb-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={clearCart}
          >
            Clear Cart
          </Button>
          <Button
            className="flex-1"
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </div>
      </div>
    </>
  );

  // Render checkout details form
  const renderDetailsForm = () => (
    <form onSubmit={checkoutForm.handleSubmit(handleCheckoutSubmit)} className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-6 mb-10">
      <ScrollArea className="flex-1">
        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Customer Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name</Label>
              <Input
                id="customerName"
                {...checkoutForm.register('customerName')}
                className={checkoutForm.formState.errors.customerName ? 'border-destructive' : ''}
              />
              {checkoutForm.formState.errors.customerName && (
                <p className="text-sm text-destructive">{checkoutForm.formState.errors.customerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                {...checkoutForm.register('customerEmail')}
                className={checkoutForm.formState.errors.customerEmail ? 'border-destructive' : ''}
              />
              {checkoutForm.formState.errors.customerEmail && (
                <p className="text-sm text-destructive">{checkoutForm.formState.errors.customerEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="0771234567"
                {...checkoutForm.register('customerPhone')}
                className={checkoutForm.formState.errors.customerPhone ? 'border-destructive' : ''}
              />
              {checkoutForm.formState.errors.customerPhone && (
                <p className="text-sm text-destructive">{checkoutForm.formState.errors.customerPhone.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Pickup Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Pickup Details
            </h3>

            <div className="space-y-2">
              <Label htmlFor="pickupDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Pickup Date
              </Label>
              <Input
                id="pickupDate"
                type="date"
                min={getMinDate()}
                {...checkoutForm.register('pickupDate')}
                className={checkoutForm.formState.errors.pickupDate ? 'border-destructive' : ''}
              />
              {checkoutForm.formState.errors.pickupDate && (
                <p className="text-sm text-destructive">{checkoutForm.formState.errors.pickupDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pickup Time
              </Label>
              <Select
                value={checkoutForm.watch('pickupTime')}
                onValueChange={(value) => checkoutForm.setValue('pickupTime', value, { shouldValidate: true })}
              >
                <SelectTrigger className={checkoutForm.formState.errors.pickupTime ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select pickup time" />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {checkoutForm.formState.errors.pickupTime && (
                <p className="text-sm text-destructive">{checkoutForm.formState.errors.pickupTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any dietary requirements or special requests..."
                {...checkoutForm.register('specialInstructions')}
                className={checkoutForm.formState.errors.specialInstructions ? 'border-destructive' : ''}
              />
              {checkoutForm.formState.errors.specialInstructions && (
                <p className="text-sm text-destructive">{checkoutForm.formState.errors.specialInstructions.message}</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Order Summary
            </h3>
            <div className="bg-muted rounded-lg p-3 space-y-2">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t pt-4 space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setCurrentStep(STEPS.CART)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue to Payment
          </Button>
        </div>
      </div>
    </form>
  );

  // Render payment form
  const renderPaymentForm = () => (
    <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-6 mb-10">
      <ScrollArea className="flex-1">
        <div className="space-y-4 py-4">
          {/* Mock Payment Gateway Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 text-center">
            <Lock className="h-6 w-6 mx-auto mb-2" />
            <h3 className="font-semibold">Secure Payment</h3>
            <p className="text-sm text-blue-100">Your payment is protected</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  {...paymentForm.register('cardNumber', {
                    onChange: (e) => {
                      const formatted = formatCardNumber(e.target.value);
                      e.target.value = formatted;
                      paymentForm.setValue('cardNumber', formatted.replace(/\s/g, ''));
                    }
                  })}
                  className={paymentForm.formState.errors.cardNumber ? 'border-destructive pr-12' : 'pr-12'}
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {paymentForm.formState.errors.cardNumber && (
                <p className="text-sm text-destructive">{paymentForm.formState.errors.cardNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardHolder">Cardholder Name</Label>
              <Input
                id="cardHolder"
                placeholder="JOHN DOE"
                {...paymentForm.register('cardHolder')}
                className={paymentForm.formState.errors.cardHolder ? 'border-destructive' : ''}
                style={{ textTransform: 'uppercase' }}
              />
              {paymentForm.formState.errors.cardHolder && (
                <p className="text-sm text-destructive">{paymentForm.formState.errors.cardHolder.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  maxLength={5}
                  {...paymentForm.register('expiryDate', {
                    onChange: (e) => {
                      const formatted = formatExpiryDate(e.target.value);
                      e.target.value = formatted;
                      paymentForm.setValue('expiryDate', formatted);
                    }
                  })}
                  className={paymentForm.formState.errors.expiryDate ? 'border-destructive' : ''}
                />
                {paymentForm.formState.errors.expiryDate && (
                  <p className="text-sm text-destructive">{paymentForm.formState.errors.expiryDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder="•••"
                  maxLength={4}
                  {...paymentForm.register('cvv')}
                  className={paymentForm.formState.errors.cvv ? 'border-destructive' : ''}
                />
                {paymentForm.formState.errors.cvv && (
                  <p className="text-sm text-destructive">{paymentForm.formState.errors.cvv.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="bg-muted rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount to Pay</span>
              <span className="text-2xl font-bold">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t pt-4 space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setCurrentStep(STEPS.DETAILS)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
            <Lock className="h-4 w-4 mr-2" />
            Pay {formatPrice(totalAmount)}
          </Button>
        </div>
      </div>
    </form>
  );

  // Render processing state
  const renderProcessing = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
        <CreditCard className="h-10 w-10 text-primary" />
      </div>
      <h3 className="mt-8 text-lg font-semibold">Processing Payment</h3>
      <p className="text-muted-foreground text-center mt-2">
        Please wait while we process your payment...
      </p>
    </div>
  );

  // Render success state
  const renderSuccess = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>
      <h3 className="mt-6 text-xl font-semibold">Order Placed Successfully!</h3>
      <p className="text-muted-foreground text-center mt-2">
        Thank you for your order. You'll receive a confirmation email shortly.
      </p>
      <div className="bg-muted rounded-lg p-4 mt-6 w-full max-w-xs text-center">
        <p className="text-sm text-muted-foreground">Pickup scheduled for</p>
        <p className="font-semibold mt-1">
          {checkoutData?.pickupDate && new Date(checkoutData.pickupDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        <p className="text-lg font-bold text-primary">{checkoutData?.pickupTime}</p>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Redirecting to your orders...
      </p>
    </div>
  );

  // Main render
  const getStepContent = () => {
    switch (currentStep) {
      case STEPS.CART:
        return items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm">Add some items to get started</p>
            <Button 
              className="mt-4" 
              onClick={() => {
                onOpenChange(false);
                navigate('/menu');
              }}
            >
              Browse Menu
            </Button>
          </div>
        ) : renderCartItems();
      case STEPS.DETAILS:
        return renderDetailsForm();
      case STEPS.PAYMENT:
        return renderPaymentForm();
      case STEPS.PROCESSING:
        return renderProcessing();
      case STEPS.SUCCESS:
        return renderSuccess();
      default:
        return null;
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case STEPS.CART:
        return items.length === 0 ? 'Your cart is empty' : 'Review your items and checkout';
      case STEPS.DETAILS:
        return 'Enter pickup details';
      case STEPS.PAYMENT:
        return 'Complete your payment';
      case STEPS.PROCESSING:
        return 'Processing...';
      case STEPS.SUCCESS:
        return 'Order confirmed!';
      default:
        return '';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {currentStep === STEPS.CART && 'Your Cart'}
            {currentStep === STEPS.DETAILS && 'Checkout'}
            {currentStep === STEPS.PAYMENT && 'Payment'}
            {currentStep === STEPS.PROCESSING && 'Processing'}
            {currentStep === STEPS.SUCCESS && 'Success'}
            {currentStep === STEPS.CART && totalItems > 0 && (
              <Badge variant="secondary">{totalItems} items</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {getStepDescription()}
          </SheetDescription>
        </SheetHeader>

        {getStepContent()}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;

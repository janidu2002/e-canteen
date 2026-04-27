import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  Package,
  Eye,
  RefreshCw,
  Calendar,
  MapPin,
} from 'lucide-react';
import { orderAPI } from '../../api/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const API_BASE_URL = 'http://localhost:5000';

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    step: 1,
  },
  preparing: {
    icon: ChefHat,
    label: 'Preparing',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    step: 2,
  },
  ready: {
    icon: Package,
    label: 'Ready for Pickup',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    step: 3,
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    step: 4,
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    step: 0,
  },
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      const orders = response.data?.data?.orders || response.data?.orders || [];
      setOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      toast.error('Failed to fetch your orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await orderAPI.cancel(orderId);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  const formatPrice = (price) => `Rs. ${(price || 0).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
          <p className="text-muted-foreground">
            Your order history will appear here once you place an order
          </p>
          <Button className="mt-4" asChild>
            <a href="/menu">Browse Menu</a>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status?.icon || Clock;
            const canCancel = order.status === 'pending';

            return (
              <Card key={order._id} className="border border-primary">
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(order.createdAt), 'MMMM d, yyyy · h:mm a')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={status?.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status?.label || order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Pickup Info */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {order.pickupDate 
                          ? format(new Date(order.pickupDate), 'MMM d, yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.pickupTime || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>E-Canteen Counter</span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex flex-wrap gap-2">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg bg-muted p-2"
                      >
                        <div className="h-10 w-10 rounded overflow-hidden bg-background">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm">
                          <p className="font-medium line-clamp-1">{item.name}</p>
                          <p className="text-muted-foreground">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="flex items-center px-3 rounded-lg bg-muted text-sm text-muted-foreground">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Progress Steps (for active orders) */}
                  {!['completed', 'cancelled'].includes(order.status) && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        {['pending', 'preparing', 'ready', 'completed'].map(
                          (step, index) => {
                            const stepConfig = statusConfig[step];
                            const StepIcon = stepConfig.icon;
                            const currentStep = statusConfig[order.status]?.step || 0;
                            const isActive = stepConfig.step <= currentStep;
                            const isCurrent = step === order.status;

                            return (
                              <div
                                key={step}
                                className="flex flex-col items-center gap-1"
                              >
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    isActive
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                >
                                  <StepIcon className="h-4 w-4" />
                                </div>
                                <span
                                  className={`text-xs ${
                                    isActive ? 'font-medium' : 'text-muted-foreground'
                                  } hidden sm:block`}
                                >
                                  {step === 'ready' ? 'Ready' : stepConfig.label}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold">
                    Total: {formatPrice(order.totalAmount)}
                  </span>
                  <div className="flex gap-2">
                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        Cancel Order
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={statusConfig[selectedOrder.status]?.color}
                  >
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Items</h4>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pickup Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Pickup Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>
                      {selectedOrder.pickupDate 
                        ? format(new Date(selectedOrder.pickupDate), 'EEEE, MMMM d, yyyy')
                        : 'N/A'}
                    </span>
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{selectedOrder.pickupTime || 'N/A'}</span>
                    <span className="text-muted-foreground">Location:</span>
                    <span>E-Canteen Counter</span>
                  </div>
                  {selectedOrder.specialInstructions && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Special Instructions:</p>
                      <p className="text-sm bg-muted p-2 rounded mt-1">{selectedOrder.specialInstructions}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment & Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="capitalize">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant={selectedOrder.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                      {selectedOrder.paymentStatus || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                {/* Status History */}
                {selectedOrder.statusHistory?.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold">Order Timeline</h4>
                      <div className="space-y-3">
                        {selectedOrder.statusHistory.map((history, index) => {
                          const config = statusConfig[history.status];
                          const Icon = config?.icon || Clock;

                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                  config?.color || 'bg-gray-100'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {config?.label || history.status}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(history.timestamp),
                                    'MMM d, h:mm a'
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrdersPage;

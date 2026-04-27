import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Clock,
  ChefHat,
  Package,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { orderAPI } from '../../api/axios';
import { ORDER_STATUSES } from '../../validations/schemas';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const API_BASE_URL = 'http://localhost:5000';

const statusIcons = {
  pending: Clock,
  preparing: ChefHat,
  ready: Package,
  completed: CheckCircle,
  cancelled: XCircle,
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      const orders = response.data?.data?.orders || response.data?.orders || [];
      setOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      await orderAPI.updateStatus(orderId, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      preparing: 'bg-blue-100 text-blue-800 border-blue-200',
      ready: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => `Rs. ${(price || 0).toFixed(2)}`;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  const getNextStatuses = (currentStatus) => {
    const flow = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return flow[currentStatus] || [];
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order #, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                const nextStatuses = getNextStatuses(order.status);

                return (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{order.items?.length || 0} items</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {order.pickupDate 
                            ? format(new Date(order.pickupDate), 'MMM d') 
                            : 'N/A'}
                        </span>
                        <span className="text-muted-foreground">at</span>
                        <span className="font-medium">{order.pickupTime || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {order.status === 'ready' ? 'Ready' : order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {nextStatuses.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" disabled={isUpdating}>
                                Update
                                <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {nextStatuses.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => updateOrderStatus(order._id, status)}
                                  className={
                                    status === 'cancelled' ? 'text-destructive' : ''
                                  }
                                >
                                  {ORDER_STATUSES.find((s) => s.value === status)?.label ||
                                    status}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedOrder.status)}
                  >
                    {selectedOrder.status === 'ready' ? 'Ready for Pickup' : selectedOrder.status}
                  </Badge>
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{selectedOrder.customerName}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedOrder.customerEmail}</span>
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                </div>

                <Separator />

                {/* Pickup Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Pickup Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>
                      {selectedOrder.pickupDate 
                        ? format(new Date(selectedOrder.pickupDate), 'EEEE, MMMM d, yyyy')
                        : 'N/A'}
                    </span>
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{selectedOrder.pickupTime || 'N/A'}</span>
                  </div>
                  {selectedOrder.specialInstructions && (
                    <div className="mt-2">
                      <p className="text-muted-foreground text-sm">Special Instructions:</p>
                      <p className="text-sm bg-muted p-2 rounded mt-1">{selectedOrder.specialInstructions}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Order Items</h4>
                  <div className="space-y-3">
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
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                              No img
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
                  {selectedOrder.paymentId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-mono text-xs">{selectedOrder.paymentId}</span>
                    </div>
                  )}
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
                      <h4 className="font-semibold">Status History</h4>
                      <div className="space-y-2">
                        {selectedOrder.statusHistory.map((history, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <Badge
                              variant="outline"
                              className={getStatusColor(history.status)}
                            >
                              {history.status === 'ready' ? 'Ready for Pickup' : history.status}
                            </Badge>
                            <span className="text-muted-foreground">
                              {format(new Date(history.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        ))}
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

export default AdminOrders;

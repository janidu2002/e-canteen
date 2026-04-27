import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { orderAPI, menuAPI } from '../../api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, lowStockRes, ordersRes] = await Promise.all([
          orderAPI.getStats(),
          menuAPI.getLowStock(),
          orderAPI.getAll({ limit: 5 }),
        ]);

        setStats(statsRes.data?.data || statsRes.data);
        // API returns { data: { items: [...] } }
        const lowStock = lowStockRes.data?.data?.items || lowStockRes.data?.items || [];
        setLowStockItems(Array.isArray(lowStock) ? lowStock : []);
        // API returns { data: { orders: [...] } }
        const orders = ordersRes.data?.data?.orders || ordersRes.data?.orders || [];
        setRecentOrders(Array.isArray(orders) ? orders : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatPrice = (price) => {
    return `Rs. ${(price || 0).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      preparing: 'bg-blue-500',
      'out-for-delivery': 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const statsCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Revenue',
      value: formatPrice(stats?.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  // Mock data for charts (will be replaced with real data)
  const ordersByStatus = [
    { name: 'Pending', value: stats?.pendingOrders || 0 },
    { name: 'Preparing', value: stats?.preparingOrders || 0 },
    { name: 'Delivery', value: stats?.outForDeliveryOrders || 0 },
    { name: 'Completed', value: stats?.completedOrders || 0 },
    { name: 'Cancelled', value: stats?.cancelledOrders || 0 },
  ].filter(item => item.value > 0);

  const revenueByDay = stats?.revenueByDay || [
    { day: 'Mon', revenue: 0 },
    { day: 'Tue', revenue: 0 },
    { day: 'Wed', revenue: 0 },
    { day: 'Thu', revenue: 0 },
    { day: 'Fri', revenue: 0 },
    { day: 'Sat', revenue: 0 },
    { day: 'Sun', revenue: 0 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Current order distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No order data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
            <CardDescription>Revenue trend this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.totalAmount)}</p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs text-white ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent orders</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        {item.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">All items are well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

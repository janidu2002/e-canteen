import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Bell,
  CheckCircle,
  ShoppingCart,
  AlertTriangle,
  Truck,
  Trash2,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { notificationAPI } from '../../api/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const notificationIcons = {
  'new-order': ShoppingCart,
  'low-stock': AlertTriangle,
  'order-status': Truck,
};

const notificationColors = {
  'new-order': 'bg-blue-100 text-blue-600',
  'low-stock': 'bg-yellow-100 text-yellow-600',
  'order-status': 'bg-purple-100 text-purple-600',
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      // API returns { data: { notifications: [...], unreadCount, pagination } }
      const notifications = response.data?.data?.notifications || response.data?.notifications || [];
      setNotifications(Array.isArray(notifications) ? notifications : []);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await notificationAPI.delete(deleteId);
      setNotifications((prev) => prev.filter((n) => n._id !== deleteId));
      toast.success('Notification deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with orders and stock alerts
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
          <p className="text-muted-foreground">
            You're all caught up! New notifications will appear here.
          </p>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClass =
                  notificationColors[notification.type] || 'bg-gray-100 text-gray-600';

                return (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                          </span>
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification._id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              onClick={() => setDeleteId(notification._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-destructive-foreground hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotifications;

import { useState, useEffect } from 'react';
import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { menuAPI } from '../../api/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

const API_BASE_URL = 'http://localhost:5000';

const AdminLowStock = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      const response = await menuAPI.getLowStock();
      // API returns { data: { items: [...] } }
      const items = response.data?.data?.items || response.data?.items || [];
      setItems(Array.isArray(items) ? items : []);
    } catch (error) {
      toast.error('Failed to fetch low stock items');
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  const formatPrice = (price) => `Rs. ${price.toFixed(2)}`;

  const getStockPercentage = (stock, threshold) => {
    if (threshold === 0) return 100;
    return Math.min((stock / threshold) * 100, 100);
  };

  const getStockColor = (stock, threshold) => {
    const percentage = getStockPercentage(stock, threshold);
    if (percentage <= 25) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            Low Stock Items
          </h1>
          <p className="text-muted-foreground mt-1">
            Items that need restocking based on their threshold settings
          </p>
        </div>
        <Button variant="outline" onClick={fetchLowStockItems}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Summary</CardTitle>
          <CardDescription>
            {items.length === 0
              ? 'All items are well stocked!'
              : `${items.length} item${items.length > 1 ? 's' : ''} need${
                  items.length === 1 ? 's' : ''
                } restocking`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Items List */}
      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-semibold">All items are well stocked</h3>
          <p className="text-muted-foreground">
            No items are currently below their low stock threshold
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Stock Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {!item.isAvailable && (
                        <Badge variant="secondary" className="mt-1">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <span
                      className={`font-bold ${
                        item.stock === 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell>{item.lowStockThreshold}</TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getStockColor(item.stock, item.lowStockThreshold)}`}
                          style={{ width: `${getStockPercentage(item.stock, item.lowStockThreshold)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.stock === 0
                          ? 'Out of stock'
                          : `${Math.round(
                              getStockPercentage(item.stock, item.lowStockThreshold)
                            )}% of threshold`}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default AdminLowStock;

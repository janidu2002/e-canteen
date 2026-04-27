import { useState, useEffect } from 'react';
import { Search, Plus, UtensilsCrossed, Package } from 'lucide-react';
import { menuAPI } from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { MENU_CATEGORIES } from '../../validations/schemas';
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = 'http://localhost:5000';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { addItem } = useCart();

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await menuAPI.getAll();
        // API returns { data: { items: [...], pagination: {...} } }
        const items = response.data?.data?.items || response.data?.items || [];
        // Filter only available items for students
        setMenuItems(Array.isArray(items) ? items.filter((item) => item.isAvailable) : []);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  const formatPrice = (price) => `Rs. ${price.toFixed(2)}`;

  const handleAddToCart = (item) => {
    addItem(item, 1);
  };

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group items by category for display this
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu</h1>
          <p className="text-muted-foreground">
            Browse our delicious selection of food
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {MENU_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No items found</h3>
          <p className="text-muted-foreground">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No menu items available at the moment'}
          </p>
        </Card>
      ) : categoryFilter === 'all' && !searchQuery ? (
        // Show grouped by category
        Object.entries(groupedItems).map(([category, items]) => (
          <section key={category} className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {category}
              </Badge>
              <span className="text-muted-foreground text-sm font-normal">
                ({items.length} items)
              </span>
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  getImageUrl={getImageUrl}
                  formatPrice={formatPrice}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        // Show flat grid when filtered
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              getImageUrl={getImageUrl}
              formatPrice={formatPrice}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Separate component for menu item card
const MenuItemCard = ({ item, getImageUrl, formatPrice, onAddToCart }) => {
  const isOutOfStock = item.stock === 0;

  return (
    <Card className="overflow-hidden group flex flex-col !pt-0">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {item.image ? (
          <img
            src={getImageUrl(item.image)}
            alt={item.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge className="absolute top-2 left-2">{item.category}</Badge>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1">{item.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {item.description || 'Delicious food item from our kitchen'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between pt-0 mt-auto">
        <div>
          <span className="text-lg font-bold text-primary">
            {formatPrice(item.price)}
          </span>
          {item.stock > 0 && item.stock <= 10 && (
            <p className="text-xs text-yellow-600">Only {item.stock} left</p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onAddToCart(item)}
          disabled={isOutOfStock}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MenuPage;

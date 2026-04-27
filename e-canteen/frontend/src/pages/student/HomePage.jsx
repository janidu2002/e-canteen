import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Plus, UtensilsCrossed } from 'lucide-react';
import { menuAPI } from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Button } from '@/components/ui/button';
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

const HomePage = () => {
  const [recentItems, setRecentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        const response = await menuAPI.getRecent();
        // API returns { data: { items: [...] } }
        const items = response.data?.data?.items || response.data?.items || [];
        setRecentItems(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error('Failed to fetch recent items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentItems();
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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-primary p-8 md:p-12 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to E-Canteen
          </h1>
          <p className="text-lg md:text-xl mb-6 opacity-90 max-w-2xl">
            Order your favorite meals from the university canteen. Fast, easy, and
            delicious food delivered right to you.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/menu">
                Browse Menu
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10">
          <UtensilsCrossed className="h-64 w-64" />
        </div>
      </section>

      {/* Recently Added Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Recently Added</h2>
            <p className="text-muted-foreground">Fresh additions to our menu</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/menu">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
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
        ) : recentItems.length === 0 ? (
          <Card className="p-12 text-center">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No items available</h3>
            <p className="text-muted-foreground">
              Check back later for new menu items
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.slice(0, 4).map((item) => (
              <Card key={item._id} className="overflow-hidden group">
                <div className="relative h-48 bg-muted overflow-hidden">
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
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.description || 'Delicious food item'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between pt-0">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(item.price)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock === 0 || !item.isAvailable}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Easy Ordering</h3>
          <p className="text-sm text-muted-foreground">
            Browse the menu, add items to cart, and checkout in seconds
          </p>
        </Card>
        <Card className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Fresh Food</h3>
          <p className="text-sm text-muted-foreground">
            All items are freshly prepared by our campus kitchen
          </p>
        </Card>
        <Card className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Track Orders</h3>
          <p className="text-sm text-muted-foreground">
            Real-time updates on your order status from kitchen to delivery
          </p>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;

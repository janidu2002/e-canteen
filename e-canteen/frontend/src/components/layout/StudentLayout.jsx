import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Home,
  UtensilsCrossed,
  ClipboardList,
  ShoppingCart,
  LogOut,
  User,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import CartSheet from '../cart/CartSheet';

const navigationItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
    end: true,
  },
  {
    title: 'Menu',
    url: '/menu',
    icon: UtensilsCrossed,
  },
  {
    title: 'My Orders',
    url: '/my-orders',
    icon: ClipboardList,
  },
];

const StudentLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems, isOpen, openCart, closeCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl">E-Canteen</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  variant="default"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/my-orders" className="cursor-pointer">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      My Orders
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <NavLink to="/login">Sign In</NavLink>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px]">
                <div className="flex flex-col gap-4 mt-8">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </NavLink>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Cart Sheet */}
      <CartSheet open={isOpen} onOpenChange={closeCart} />

      {/* Toast Notifications */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
};

export default StudentLayout;

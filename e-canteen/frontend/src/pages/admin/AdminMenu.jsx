import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Upload,
  X,
  Package,
} from 'lucide-react';
import { menuAPI } from '../../api/axios';
import { menuItemSchema, MENU_CATEGORIES } from '../../validations/schemas';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Toggle } from '@/components/ui/toggle';

const API_BASE_URL = 'http://localhost:5000';

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      price: 0,
      category: 'Snacks',
      stock: 0,
      lowStockThreshold: 10,
      description: '',
      isAvailable: true,
    },
  });

  const isAvailable = watch('isAvailable');
  const category = watch('category');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await menuAPI.getAll();
      // API returns { data: { items: [...], pagination: {...} } }
      const items = response.data?.data?.items || response.data?.items || [];
      setMenuItems(Array.isArray(items) ? items : []);
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    reset({
      name: item.name,
      price: item.price,
      category: item.category,
      stock: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      description: item.description || '',
      isAvailable: item.isAvailable,
    });
    if (item.image) {
      setImagePreview(`${API_BASE_URL}${item.image}`);
    }
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    reset({
      name: '',
      price: 0,
      category: 'Snacks',
      stock: 0,
      lowStockThreshold: 10,
      description: '',
      isAvailable: true,
    });
    clearImage();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    reset();
    clearImage();
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingItem) {
        await menuAPI.update(editingItem._id, formData);
        toast.success('Menu item updated successfully');
      } else {
        await menuAPI.create(formData);
        toast.success('Menu item created successfully');
      }

      closeDialog();
      fetchMenuItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await menuAPI.delete(deleteItem._id);
      toast.success('Menu item deleted successfully');
      setDeleteItem(null);
      fetchMenuItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  const formatPrice = (price) => `Rs. ${price.toFixed(2)}`;

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
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
        <div className="flex gap-2">
          <Toggle
            pressed={viewMode === 'grid'}
            onPressedChange={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={viewMode === 'list'}
            onPressedChange={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No items found</h3>
          <p className="text-muted-foreground">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding a menu item'}
          </p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <Card key={item._id} className="overflow-hidden pt-0">
              <div className="relative h-48 bg-muted">
                {item.image ? (
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.isLowStock && (
                    <Badge variant="destructive" className="bg-red-500 text-white">Low Stock</Badge>
                  )}
                  {!item.isAvailable && (
                    <Badge variant="secondary">Unavailable</Badge>
                  )}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{item.name}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                  </div>
                  <span className="font-bold text-primary">
                    {formatPrice(item.price)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description || 'No description'}
                </p>
                <p className="mt-2 text-sm">
                  Stock: <span className="font-medium">{item.stock}</span>
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-primary border border-primary hover:text-white hover:bg-primary"
                  onClick={() => openEditDialog(item)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border border-red-500 hover:text-white hover:bg-red-500"
                  onClick={() => setDeleteItem(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
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
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <span className={item.isLowStock ? 'text-red-600 font-medium' : ''}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.isLowStock && (
                        <Badge variant="destructive" className="text-xs">
                          Low
                        </Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge variant="secondary" className="text-xs">
                          Unavailable
                        </Badge>
                      )}
                      {item.isAvailable && !item.isLowStock && (
                        <Badge variant="outline" className="text-xs">
                          Available
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the menu item details below.'
                : 'Fill in the details to add a new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                        onClick={clearImage}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Item name"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Rs.) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    className={errors.price ? 'border-destructive' : ''}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {MENU_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* Stock & Threshold */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    {...register('stock', { valueAsNumber: true })}
                    className={errors.stock ? 'border-destructive' : ''}
                  />
                  {errors.stock && (
                    <p className="text-sm text-destructive">{errors.stock.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold *</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    {...register('lowStockThreshold', { valueAsNumber: true })}
                    className={errors.lowStockThreshold ? 'border-destructive' : ''}
                  />
                  {errors.lowStockThreshold && (
                    <p className="text-sm text-destructive">
                      {errors.lowStockThreshold.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Item description..."
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Available Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Available for Order</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle off to hide from menu
                  </p>
                </div>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={(checked) => setValue('isAvailable', checked)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingItem
                  ? 'Update Item'
                  : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action
              cannot be undone.
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

export default AdminMenu;

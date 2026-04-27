import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, RoleRoute, GuestRoute } from './components/ProtectedRoute';
import './App.css';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminOrders from './pages/admin/AdminOrders';
import AdminLowStock from './pages/admin/AdminLowStock';
import AdminNotifications from './pages/admin/AdminNotifications';

// Student Pages
import HomePage from './pages/student/HomePage';
import MenuPage from './pages/student/MenuPage';
import MyOrdersPage from './pages/student/MyOrdersPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </RoleRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="low-stock" element={<AdminLowStock />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>

            {/* Student Routes */}
            <Route path="/" element={<StudentLayout />}>
              <Route index element={<HomePage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route
                path="my-orders"
                element={
                  <ProtectedRoute>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

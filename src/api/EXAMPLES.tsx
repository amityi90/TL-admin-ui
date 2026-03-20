/* eslint-disable */
/**
 * =====================================================
 * EXAMPLE: Using the TL-Luxury Admin API Service Layer
 * =====================================================
 * 
 * This file contains example code demonstrating how to use
 * the API service layer. It's for reference only.
 * 
 * NOTE: Linting is disabled for this file as it contains
 * example code snippets that are not meant to be executed.
 */

import { useEffect, useState } from 'react';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  fetchAllOrderLists,
  shipOrder,
  confirmArrival,
  archiveOrder 
} from '../api/adminService';
import type { Product, Order } from '../types';

// =====================================================
// EXAMPLE 1: Product Management
// =====================================================

export const ProductManagementExample = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      // Error toast is already shown by adminService
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Create a new product
  const handleCreateProduct = async () => {
    try {
      const newProduct = await createProduct({
        name: 'Luxury Watch',
        description: 'Swiss-made luxury timepiece',
        price: 15000,
        images: ['https://example.com/watch.jpg'],
        category: 'Watches',
        material: 'Stainless Steel',
        stockCount: 5
      });
      
      // Update state optimistically or refetch
      setProducts(prev => [...prev, newProduct]);
      // toast.success is already shown by adminService
    } catch (error) {
      // Error handling done by adminService
    }
  };

  // Update a product
  const handleUpdateProduct = async (id: string) => {
    try {
      const updated = await updateProduct(id, {
        name: 'Updated Product Name',
        description: 'New description',
        price: 20000,
        images: [],
        category: 'Watches',
        material: 'Gold',
        stockCount: 3
      });
      
      // Update state
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
    } catch (error) {
      // Error handled by adminService
    }
  };

  // Delete a product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      await deleteProduct(id);
      // Remove from state
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      // Error handled by adminService
    }
  };

  return null; // Your UI here
};

// =====================================================
// EXAMPLE 2: Logistics Dashboard with Promise.all
// =====================================================

export const LogisticsDashboardExample = () => {
  // Separate state for each status
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);
  const [arrivedOrders, setArrivedOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all 4 lists simultaneously using Promise.all
  const loadAllOrders = async () => {
    setLoading(true);
    try {
      // This makes 4 parallel requests and waits for all to complete
      const { pending, shipped, arrived, archived } = await fetchAllOrderLists();
      
      setPendingOrders(pending);
      setShippedOrders(shipped);
      setArrivedOrders(arrived);
      setArchivedOrders(archived);
    } catch (error) {
      // Error toast already shown by adminService
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  // Handle moving order from Pending to Shipped
  const handleShipOrder = async (orderId: string) => {
    const orderToShip = pendingOrders.find(o => o.id === orderId);
    if (!orderToShip) return;

    // Optimistic update: immediately update UI
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    setShippedOrders(prev => [...prev, { 
      ...orderToShip, 
      status: 'shipped',
      carrierName: 'FedEx',
      trackingNumber: 'TRACK123456',
      shippedDate: new Date().toISOString()
    }]);

    try {
      // Make API call
      await shipOrder(orderId, {
        carrierName: 'FedEx',
        trackingNumber: 'TRACK123456'
      });
      // Success! Toast already shown
    } catch (error) {
      // Rollback on error
      setPendingOrders(prev => [...prev, orderToShip]);
      setShippedOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  // Handle moving order from Shipped to Arrived
  const handleConfirmArrival = async (orderId: string) => {
    const orderToConfirm = shippedOrders.find(o => o.id === orderId);
    if (!orderToConfirm) return;

    // Optimistic update
    setShippedOrders(prev => prev.filter(o => o.id !== orderId));
    setArrivedOrders(prev => [...prev, {
      ...orderToConfirm,
      status: 'arrived',
      arrivalDate: new Date().toISOString()
    }]);

    try {
      await confirmArrival(orderId, {
        arrivalDate: new Date().toISOString()
      });
    } catch (error) {
      // Rollback
      setShippedOrders(prev => [...prev, orderToConfirm]);
      setArrivedOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  // Handle moving order from Arrived to Archived
  const handleArchiveOrder = async (orderId: string) => {
    if (!confirm('Archive this order?')) return;
    
    const orderToArchive = arrivedOrders.find(o => o.id === orderId);
    if (!orderToArchive) return;

    // Optimistic update
    setArrivedOrders(prev => prev.filter(o => o.id !== orderId));
    setArchivedOrders(prev => [...prev, {
      ...orderToArchive,
      status: 'archived',
      archivedDate: new Date().toISOString()
    }]);

    try {
      await archiveOrder(orderId);
    } catch (error) {
      // Rollback
      setArrivedOrders(prev => [...prev, orderToArchive]);
      setArchivedOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  return (
    <div>
      <h2>Logistics Dashboard</h2>
      
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <>
          <section>
            <h3>Pending ({pendingOrders.length})</h3>
            {pendingOrders.map(order => (
              <div key={order.id}>
                {order.orderId} - {order.customerName}
                <button onClick={() => handleShipOrder(order.id)}>
                  Mark as Shipped
                </button>
              </div>
            ))}
          </section>

          <section>
            <h3>Shipped ({shippedOrders.length})</h3>
            {shippedOrders.map(order => (
              <div key={order.id}>
                {order.orderId} - {order.carrierName} #{order.trackingNumber}
                <button onClick={() => handleConfirmArrival(order.id)}>
                  Confirm Arrival
                </button>
              </div>
            ))}
          </section>

          <section>
            <h3>Arrived ({arrivedOrders.length})</h3>
            {arrivedOrders.map(order => (
              <div key={order.id}>
                {order.orderId}
                <button onClick={() => handleArchiveOrder(order.id)}>
                  Archive
                </button>
              </div>
            ))}
          </section>

          <section>
            <h3>Archived ({archivedOrders.length})</h3>
            {archivedOrders.map(order => (
              <div key={order.id}>
                {order.orderId} (Completed)
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
};

// =====================================================
// EXAMPLE 3: Error Handling
// =====================================================

export const ErrorHandlingExample = () => {
  // 401 Unauthorized - Automatic redirect to /login
  // No need to handle manually, interceptor does it

  // Custom error handling if needed
  const customErrorHandling = async () => {
    try {
      await getProducts();
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Products not found');
      } else if (error.response?.status === 500) {
        console.log('Server error');
      }
      // Generic error toast already shown by adminService
    }
  };

  return null;
};

// =====================================================
// EXAMPLE 4: Authentication Token
// =====================================================

export const AuthExample = () => {
  // Login and store token
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // All subsequent API calls will automatically include this token
      // via the request interceptor in api.ts
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return null;
};

// =====================================================
// KEY FEATURES
// =====================================================

/*

✅ Centralized API Configuration
   - Single axios instance with base URL from env
   - Automatic token attachment
   - Global error handling

✅ Type Safety
   - All requests/responses typed with TypeScript
   - Product, Order, TrackingData, ArrivalData interfaces

✅ Automatic Error Handling
   - 401 → Clear token + redirect to login
   - 403 → Access forbidden toast
   - 500+ → Server error toast

✅ Luxury Toast Notifications
   - Success: "Product created", "Order shipped", etc.
   - Error: "Failed to...", with specific messages

✅ Promise.all for Performance
   - Fetch all 4 order lists simultaneously
   - Reduces total waiting time

✅ Optimistic UI Updates
   - Update UI immediately
   - Rollback if API call fails
   - Smooth user experience

✅ Clean Separation of Concerns
   - Types: src/types/index.ts
   - API Config: src/services/api.ts
   - API Functions: src/api/adminService.ts
   - UI Components: src/pages/...

*/

# TL-Luxury Admin API Service Layer

## Overview

Centralized API service layer using Axios and TypeScript for the TL-Luxury Admin Dashboard.

## Architecture

### 1. Axios Instance (`src/services/api.ts`)
- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Request Interceptor**: Automatically attaches `Authorization: Bearer <token>` from localStorage
- **Response Interceptor**: Handles 401 errors and redirects to `/login`

### 2. Type Definitions (`src/types/index.ts`)
- `Product`: Product interface with all fields
- `Order`: Order interface with lowercase status (`'pending' | 'shipped' | 'arrived' | 'archived'`)
- `Shipment`: UI-friendly version with capitalized status
- `TrackingData`: Shipping information
- `ArrivalData`: Arrival information

### 3. API Services (`src/api/adminService.ts`)

#### Product Services
```typescript
// Fetch all products
const products = await getProducts();

// Create product
const newProduct = await createProduct({
  name: 'Diamond Ring',
  description: '...',
  price: 5000,
  images: ['...'],
  category: 'Rings',
  material: '18k Gold',
  stockCount: 10
});

// Update product
const updated = await updateProduct('product-id', { price: 6000 });

// Delete product
await deleteProduct('product-id');
```

#### Logistics/Order Services
```typescript
// Fetch orders by status
const pendingOrders = await getOrdersByStatus('pending');

// Fetch all 4 lists simultaneously
const allLists = await fetchAllOrderLists();
// Returns: { pending: Order[], shipped: Order[], arrived: Order[], archived: Order[] }

// Ship an order (pending → shipped)
await shipOrder('order-id', {
  carrierName: 'FedEx',
  trackingNumber: 'TRACK123456'
});

// Confirm arrival (shipped → arrived)
await confirmArrival('order-id', {
  arrivalDate: new Date().toISOString()
});

// Archive order (arrived → archived)
await archiveOrder('order-id');
```

## UI Integration Example

### Logistics Dashboard with Promise.all

```typescript
import { useEffect, useState } from 'react';
import { fetchAllOrderLists, shipOrder, confirmArrival, archiveOrder } from '../api/adminService';
import type { Order } from '../types';

const LogisticsDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);
  const [arrivedOrders, setArrivedOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all 4 lists simultaneously
  const loadAllOrders = async () => {
    setLoading(true);
    try {
      const { pending, shipped, arrived, archived } = await fetchAllOrderLists();
      setPendingOrders(pending);
      setShippedOrders(shipped);
      setArrivedOrders(arrived);
      setArchivedOrders(archived);
    } catch (error) {
      // Error is already handled by adminService
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  // Optimistic update example for shipping an order
  const handleShipOrder = async (orderId: string, carrierName: string, trackingNumber: string) => {
    const orderToShip = pendingOrders.find(o => o.id === orderId);
    if (!orderToShip) return;

    // Optimistic UI update
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    setShippedOrders(prev => [...prev, { 
      ...orderToShip, 
      status: 'shipped',
      carrierName,
      trackingNumber 
    }]);

    try {
      await shipOrder(orderId, { carrierName, trackingNumber });
      // Success! (toast is already shown by adminService)
    } catch (error) {
      // Rollback on error
      setPendingOrders(prev => [...prev, orderToShip]);
      setShippedOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
};
```

## Error Handling

### Automatic 401 Handling
When any request returns 401:
1. Token is removed from localStorage
2. User sees toast: "Session expired. Please log in again."
3. User is redirected to `/login`

### Toast Notifications
All API functions automatically show appropriate toast messages:
- ✅ Success: "Product created successfully", "Order marked as shipped", etc.
- ❌ Error: "Failed to create product", "Failed to ship order", etc.

### Custom Error Handling
```typescript
try {
  await createProduct(productData);
} catch (error) {
  // Custom handling if needed
  console.error('Something went wrong:', error);
}
```

## Environment Variables

Make sure `.env` file contains:
```env
VITE_API_URL=http://localhost:5000
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Backend API Endpoints

The services expect these endpoints:

### Products
- `GET /admin/products` - Get all products
- `POST /admin/products` - Create product
- `PUT /admin/products/:id` - Update product
- `DELETE /admin/products/:id` - Delete product

### Orders/Logistics
- `GET /admin/orders?status=pending` - Get orders by status
- `PATCH /admin/orders/:id/ship` - Mark order as shipped
- `PATCH /admin/orders/:id/arrive` - Confirm arrival
- `PATCH /admin/orders/:id/archive` - Archive order

## Migration Guide

### From Old Service to New Service

**Before:**
```typescript
import { getShipments, updateShipmentStatus } from '../services/shipments';

const shipments = await getShipments();
await updateShipmentStatus(id, 'Shipped', { carrierName, trackingNumber });
```

**After:**
```typescript
import { fetchAllOrderLists, shipOrder } from '../api/adminService';

const { pending, shipped, arrived, archived } = await fetchAllOrderLists();
await shipOrder(id, { carrierName, trackingNumber });
```

## Best Practices

1. **Use Promise.all** for fetching multiple independent lists
2. **Optimistic Updates**: Update UI immediately, rollback on error
3. **Let adminService handle toasts**: Don't duplicate toast messages
4. **Error boundaries**: Wrap components to catch unexpected errors
5. **Type safety**: Always use TypeScript interfaces for API responses

## Testing with Mock Backend

Until the backend is ready, you can use mock data:
```typescript
// In adminService.ts, temporarily add:
if (import.meta.env.MODE === 'development') {
  return mockData; // Return mock data
}
```

Or use tools like [MSW (Mock Service Worker)](https://mswjs.io/) for realistic API mocking.

import api from '../services/api';
import type { Product, Order, OrderStatus, TrackingData, ArrivalData } from '../types';
import toast from 'react-hot-toast';

type ProductPayload = Omit<Product, 'id' | '_id'>;
type ProductUpdatePayload = Partial<ProductPayload>;

type ApiSuccessResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
};

const unwrapData = <T>(payload: ApiSuccessResponse<T> | T): T => {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        return (payload as ApiSuccessResponse<T>).data;
    }
    return payload as T;
};

const normalizeProduct = (product: Product): Product => ({
    ...product,
    id: product.id ?? product._id ?? '',
});

const normalizeOrder = (order: Order): Order => ({
    ...order,
    id: order.id ?? order._id ?? '',
});

const normalizeOrderStatus = (status: string | undefined): 'pending' | 'shipped' | 'arrived' | 'archived' | 'other' => {
    const value = (status ?? '').toLowerCase().trim();
    if (value === 'pending' || value === 'should be delivered') return 'pending';
    if (value === 'shipped' || value === 'delivered') return 'shipped';
    if (value === 'arrived') return 'arrived';
    if (value === 'archived') return 'archived';
    return 'other';
};

const requestedStatusToNormalized = (status: OrderStatus): 'pending' | 'shipped' | 'arrived' | 'archived' => {
    if (status === 'pending' || status === 'should be delivered') return 'pending';
    if (status === 'shipped' || status === 'delivered') return 'shipped';
    if (status === 'arrived') return 'arrived';
    return 'archived';
};

// ==================== PRODUCT SERVICES ====================

/**
 * Fetch all products
 */
export const getProducts = async (): Promise<Product[]> => {
    try {
        const response = await api.get<ApiSuccessResponse<Product[]> | Product[]>('/admin/products');
        const items = unwrapData<Product[]>(response.data);
        return Array.isArray(items) ? items.map(normalizeProduct) : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Create a new product
 */
export const createProduct = async (data: ProductPayload): Promise<Product> => {
    try {
        const response = await api.post<ApiSuccessResponse<Product> | Product>('/admin/products', data);
        toast.success('Product created successfully');
        return normalizeProduct(unwrapData<Product>(response.data));
    } catch (error) {
        console.error('Error creating product:', error);
        toast.error('Failed to create product');
        throw error;
    }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: string, data: ProductUpdatePayload): Promise<Product> => {
    try {
        const response = await api.put<ApiSuccessResponse<Product> | Product>(`/admin/products/${id}`, data);
        toast.success('Product updated successfully');
        return normalizeProduct(unwrapData<Product>(response.data));
    } catch (error) {
        console.error('Error updating product:', error);
        toast.error('Failed to update product');
        throw error;
    }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
    try {
        await api.delete<ApiSuccessResponse<null>>(`/admin/products/${id}`);
        toast.success('Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
        throw error;
    }
};

// ==================== LOGISTICS / ORDER SERVICES ====================

/**
 * Fetch orders by status
 */
export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
    try {
        const response = await api.get<ApiSuccessResponse<Order[]> | Order[]>(`/admin/orders`, {
            params: { status }
        });
        const items = unwrapData<Order[]>(response.data);
        return Array.isArray(items) ? items.map(normalizeOrder) : [];
    } catch (error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
            const allOrders = await getAllOrders();
            const targetStatus = requestedStatusToNormalized(status);
            return allOrders.filter((order) => normalizeOrderStatus(order.status) === targetStatus);
        }
        console.error(`Error fetching orders with status ${status}:`, error);
        throw error;
    }
};

/**
 * Fetch all orders (optionally filtered)
 */
export const getAllOrders = async (params?: { status?: OrderStatus }): Promise<Order[]> => {
    try {
        const response = await api.get<ApiSuccessResponse<Order[]> | Order[]>('/admin/orders', { params });
        const items = unwrapData<Order[]>(response.data);
        return Array.isArray(items) ? items.map(normalizeOrder) : [];
    } catch (error) {
        console.error('Error fetching all orders:', error);
        throw error;
    }
};

/**
 * Ship an order
 * Moves order from 'pending' to 'shipped' status
 */
export const shipOrder = async (id: string, trackingData: TrackingData): Promise<Order> => {
    try {
        const response = await api.patch<ApiSuccessResponse<Order> | Order>(`/admin/orders/${id}/ship`, {
            carrier: trackingData.carrier,
            trackingNumber: trackingData.trackingNumber,
        });
        toast.success('Shipment Updated');
        return normalizeOrder(unwrapData<Order>(response.data));
    } catch (error) {
        console.error('Error shipping order:', error);
        toast.error('Failed to ship order');
        throw error;
    }
};

/**
 * Confirm arrival of an order
 * Moves order from 'shipped' to 'arrived' status
 */
export const confirmArrival = async (id: string, arrivalData: ArrivalData): Promise<Order> => {
    try {
        const response = await api.patch<ApiSuccessResponse<Order> | Order>(`/admin/orders/${id}/arrive`, {
            arrivalDate: arrivalData.arrivalDate,
            arrivalTime: arrivalData.arrivalTime,
        });
        toast.success('Shipment Updated');
        return normalizeOrder(unwrapData<Order>(response.data));
    } catch (error) {
        console.error('Error confirming arrival:', error);
        toast.error('Failed to confirm arrival');
        throw error;
    }
};

/**
 * Archive an order
 * Moves order from 'arrived' to 'archived' status
 */
export const archiveOrder = async (id: string): Promise<Order> => {
    try {
        const response = await api.patch<ApiSuccessResponse<Order> | Order>(`/admin/orders/${id}/archive`);
        toast.success('Shipment Updated');
        return normalizeOrder(unwrapData<Order>(response.data));
    } catch (error) {
        console.error('Error archiving order:', error);
        toast.error('Failed to archive order');
        throw error;
    }
};

/**
 * Fetch all 4 order lists simultaneously
 * Returns an object with all status arrays
 */
export const fetchAllOrderLists = async (): Promise<{
    pending: Order[];
    shipped: Order[];
    arrived: Order[];
    archived: Order[];
}> => {
    try {
        const allOrders = await getAllOrders();

        const pending = allOrders.filter((order) => normalizeOrderStatus(order.status) === 'pending');
        const shipped = allOrders.filter((order) => normalizeOrderStatus(order.status) === 'shipped');
        const arrived = allOrders.filter((order) => normalizeOrderStatus(order.status) === 'arrived');
        const archived = allOrders.filter((order) => normalizeOrderStatus(order.status) === 'archived');

        return {
            pending,
            shipped,
            arrived,
            archived,
        };
    } catch (error) {
        console.error('Error fetching all order lists:', error);
        toast.error('Failed to load orders');
        throw error;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get order by ID
 */
export const getOrderById = async (id: string): Promise<Order> => {
    try {
        const response = await api.get<ApiSuccessResponse<Order> | Order>(`/admin/orders/${id}`);
        return normalizeOrder(unwrapData<Order>(response.data));
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
};

/**
 * Bulk update order status (if supported by backend)
 */
export const bulkUpdateOrders = async (
    ids: string[],
    status: OrderStatus
): Promise<Order[]> => {
    try {
        const response = await api.patch<ApiSuccessResponse<Order[]> | Order[]>('/admin/orders/bulk-update', {
            ids,
            status,
        });
        toast.success(`${ids.length} orders updated`);
        const items = unwrapData<Order[]>(response.data);
        return Array.isArray(items) ? items.map(normalizeOrder) : [];
    } catch (error) {
        console.error('Error bulk updating orders:', error);
        toast.error('Bulk update failed');
        throw error;
    }
};

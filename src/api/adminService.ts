import api from '../services/api';
import type { Product, Order, OrderStatus, TrackingData, ArrivalData, SiteContent } from '../types';
import toast from 'react-hot-toast';

type ProductPayload = Omit<Product, 'id' | 'createdAt'>;
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

// ==================== IMAGE UPLOAD ====================

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME = /^image\/(jpeg|png|webp|gif)$/;

// Longer timeout than the 10s instance default — several images on a slow
// connection will exceed it. Content-Type is deliberately left unset so the
// browser can attach the multipart boundary.
export const uploadProductImages = async (files: File[]): Promise<string[]> => {
    try {
        const form = new FormData();
        files.forEach((file) => form.append('files', file));
        const response = await api.post<ApiSuccessResponse<{ urls: string[] }> | { urls: string[] }>(
            '/admin/uploads',
            form,
            { timeout: 60000 }
        );
        const { urls } = unwrapData<{ urls: string[] }>(response.data);
        toast.success(files.length > 1 ? `${files.length} images uploaded` : 'Image uploaded');
        return urls;
    } catch (error) {
        console.error('Error uploading images:', error);
        const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to upload image';
        toast.error(message);
        throw error;
    }
};

// Named for products historically; the endpoint is generic, so section images
// in UI Edit go through the same call.
export const uploadImages = uploadProductImages;

// ==================== SITE CONTENT (UI EDIT) ====================

export const getSiteContent = async (): Promise<SiteContent[]> => {
    try {
        const response = await api.get<ApiSuccessResponse<SiteContent[]> | SiteContent[]>('/admin/content');
        const items = unwrapData<SiteContent[]>(response.data);
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error('Error fetching site content:', error);
        throw error;
    }
};

export const updateSiteContent = async (
    updates: { name: string; text: string }[]
): Promise<SiteContent[]> => {
    try {
        const response = await api.put<ApiSuccessResponse<SiteContent[]> | SiteContent[]>(
            '/admin/content',
            { updates }
        );
        toast.success(updates.length > 1 ? `${updates.length} fields saved` : 'Saved');
        const items = unwrapData<SiteContent[]>(response.data);
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error('Error updating site content:', error);
        const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to save changes';
        toast.error(message);
        throw error;
    }
};

// ==================== PRODUCT SERVICES ====================

export const getProducts = async (): Promise<Product[]> => {
    try {
        const response = await api.get<ApiSuccessResponse<Product[]> | Product[]>('/admin/products');
        const items = unwrapData<Product[]>(response.data);
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const createProduct = async (data: ProductPayload): Promise<Product> => {
    try {
        const response = await api.post<ApiSuccessResponse<Product> | Product>('/admin/products', data);
        toast.success('Product created successfully');
        return unwrapData<Product>(response.data);
    } catch (error) {
        console.error('Error creating product:', error);
        toast.error('Failed to create product');
        throw error;
    }
};

export const updateProduct = async (id: number, data: ProductUpdatePayload): Promise<Product> => {
    try {
        const response = await api.put<ApiSuccessResponse<Product> | Product>(`/admin/products/${id}`, data);
        toast.success('Product updated successfully');
        return unwrapData<Product>(response.data);
    } catch (error) {
        console.error('Error updating product:', error);
        toast.error('Failed to update product');
        throw error;
    }
};

export const deleteProduct = async (id: number): Promise<void> => {
    try {
        await api.delete<ApiSuccessResponse<null>>(`/admin/products/${id}`);
        toast.success('Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
        throw error;
    }
};

// ==================== ORDER SERVICES ====================

export const getAllOrders = async (params?: { status?: OrderStatus }): Promise<Order[]> => {
    try {
        const response = await api.get<ApiSuccessResponse<Order[]> | Order[]>('/admin/orders', { params });
        const items = unwrapData<Order[]>(response.data);
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error('Error fetching all orders:', error);
        throw error;
    }
};

// The backend honours ?status now, so no client-side fallback filtering.
export const getOrdersByStatus = (status: OrderStatus): Promise<Order[]> =>
    getAllOrders({ status });

export const shipOrder = async (id: number, trackingData: TrackingData): Promise<Order> => {
    try {
        const response = await api.patch<ApiSuccessResponse<Order> | Order>(`/admin/orders/${id}/ship`, {
            carrier: trackingData.carrier,
            trackingNumber: trackingData.trackingNumber,
        });
        toast.success('Shipment Updated');
        return unwrapData<Order>(response.data);
    } catch (error) {
        console.error('Error shipping order:', error);
        toast.error('Failed to ship order');
        throw error;
    }
};

export const confirmArrival = async (id: number, arrivalData: ArrivalData): Promise<Order> => {
    try {
        const response = await api.patch<ApiSuccessResponse<Order> | Order>(`/admin/orders/${id}/arrive`, {
            arrivalAt: arrivalData.arrivalAt,
        });
        toast.success('Shipment Updated');
        return unwrapData<Order>(response.data);
    } catch (error) {
        console.error('Error confirming arrival:', error);
        toast.error('Failed to confirm arrival');
        throw error;
    }
};

export const archiveOrder = async (id: number): Promise<Order> => {
    try {
        const response = await api.patch<ApiSuccessResponse<Order> | Order>(`/admin/orders/${id}/archive`);
        toast.success('Shipment Updated');
        return unwrapData<Order>(response.data);
    } catch (error) {
        console.error('Error archiving order:', error);
        toast.error('Failed to archive order');
        throw error;
    }
};

export const fetchAllOrderLists = async (): Promise<Record<OrderStatus, Order[]>> => {
    try {
        const allOrders = await getAllOrders();
        return {
            pending: allOrders.filter((o) => o.status === 'pending'),
            shipped: allOrders.filter((o) => o.status === 'shipped'),
            arrived: allOrders.filter((o) => o.status === 'arrived'),
            archived: allOrders.filter((o) => o.status === 'archived'),
        };
    } catch (error) {
        console.error('Error fetching all order lists:', error);
        toast.error('Failed to load orders');
        throw error;
    }
};

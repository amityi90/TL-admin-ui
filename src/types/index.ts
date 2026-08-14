export const CATEGORIES = ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches', 'Other'] as const;
export type Category = typeof CATEGORIES[number];

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: Category;
    material: string;
    stockCount: number;
    createdAt?: string;
}

// The API emits these exact values now. The previous 'should be delivered' /
// 'delivered' vocabulary is gone, along with the client-side translation that
// tried to paper over it.
export type OrderStatus = 'pending' | 'shipped' | 'arrived' | 'archived';

export interface OrderItem {
    id: number;
    productId: number | null;
    quantity: number;
    unitPrice: number;
    name: string | null;
    images: string[] | null;
}

export interface Order {
    id: number;
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email?: string | null;
    carrier?: string | null;
    trackingNumber?: string | null;
    arrivalAt?: string | null;
    paymentMethod: 'Card' | 'PayPal';
    paymentStatus: 'Pending' | 'Paid';
    paymentIntentId?: string | null;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    items: OrderItem[];
}

export interface TrackingData {
    carrier: string;
    trackingNumber: string;
}

export interface ArrivalData {
    arrivalAt: string; // ISO timestamp
}

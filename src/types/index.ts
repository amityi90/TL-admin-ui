export const CATEGORIES = ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches', 'Other'] as const;
export type Category = typeof CATEGORIES[number];

export interface Product {
    id: string;
    _id?: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: Category;
    material: string;
    stockCount: number;
}

export type ShipmentStatus = 'Pending' | 'Shipped' | 'Arrived' | 'Archived';
export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'arrived' | 'archived' | 'should be delivered';

export interface Shipment {
    id: string;
    _id?: string;
    orderId: string;
    customerName: string;
    productIds: string[];
    status: ShipmentStatus;
    carrierName?: string;
    trackingNumber?: string;
    shippedDate?: string; // ISO date string
    arrivalDate?: string; // ISO date string
    archivedDate?: string; // ISO date string
    createdAt: string; // ISO date string
}

// Order interface based on Mongoose schema (lowercase status)
export interface Order {
    id: string;
    _id?: string;
    orderId: string;
    customerName: string;
    customerEmail?: string;
    productIds: string[];
    status: OrderStatus;
    carrierName?: string;
    trackingNumber?: string;
    shippedDate?: string; // ISO date string
    arrivalDate?: string; // ISO date string
    archivedDate?: string; // ISO date string
    createdAt: string; // ISO date string
    updatedAt?: string; // ISO date string
}

// Tracking data for shipping
export interface TrackingData {
    carrier: string;
    trackingNumber: string;
    shippedDate?: string;
}

// Arrival data
export interface ArrivalData {
    arrivalDate: string;
    arrivalTime: string;
}

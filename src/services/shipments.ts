import type { Shipment, ShipmentStatus } from '../types/index';

export const getShipments = async (): Promise<Shipment[]> => {
    // Mock data
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: '101',
                    orderId: 'ORD-001',
                    customerName: 'Alice Vanderbilt',
                    productIds: ['1', '2'],
                    status: 'Pending',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '102',
                    orderId: 'ORD-002',
                    customerName: 'James Rothschild',
                    productIds: ['3'],
                    status: 'Shipped',
                    carrierName: 'DHL Express',
                    trackingNumber: '1234567890',
                    shippedDate: new Date().toISOString(),
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: '103',
                    orderId: 'ORD-003',
                    customerName: 'Eleanor Rigby',
                    productIds: ['1'],
                    status: 'Arrived',
                    carrierName: 'FedEx',
                    trackingNumber: '987654321',
                    shippedDate: new Date(Date.now() - 172800000).toISOString(),
                    arrivalDate: new Date().toISOString(),
                    createdAt: new Date(Date.now() - 259200000).toISOString()
                }
            ]);
        }, 800);
    });
};

export const updateShipmentStatus = async (id: string, status: ShipmentStatus, data?: Partial<Shipment>): Promise<Shipment> => {
     return new Promise((resolve) => {
         setTimeout(() => {
            resolve({ id, status, ...data } as Shipment);
         }, 800);
    });
};

import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Archive, ArrowRight, User, Calendar } from 'lucide-react';
import type { Shipment, ShipmentStatus } from '../types/index';
import { fetchAllOrderLists, shipOrder, confirmArrival, archiveOrder } from '../api/adminService';

const STATUS_TABS: ShipmentStatus[] = ['Pending', 'Shipped', 'Arrived', 'Archived'];

const Logistics = () => {
    // Separate state for each status list
    const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
    const [shippedShipments, setShippedShipments] = useState<Shipment[]>([]);
    const [arrivedShipments, setArrivedShipments] = useState<Shipment[]>([]);
    const [archivedShipments, setArchivedShipments] = useState<Shipment[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ShipmentStatus>('Pending');

    // Action State
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [modalType, setModalType] = useState<'shipped' | 'arrived' | null>(null);
    
    // Form Inputs
    const [carrierName, setCarrierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');

    // Fetch all 4 lists simultaneously using Promise.all
    const fetchAllShipments = async () => {
        setLoading(true);
        try {
            // Fetch all 4 status lists in parallel
            const { pending, shipped, arrived, archived } = await fetchAllOrderLists();
            
            // Convert Order[] to Shipment[] (status mapping)
            setPendingShipments(pending.map(convertOrderToShipment));
            setShippedShipments(shipped.map(convertOrderToShipment));
            setArrivedShipments(arrived.map(convertOrderToShipment));
            setArchivedShipments(archived.map(convertOrderToShipment));
        } catch (error) {
            console.error('Failed to load shipments:', error);
            // Error toast is already handled in adminService
        } finally {
            setLoading(false);
        }
    };

    // Helper to convert Order (lowercase status) to Shipment (capitalized status)
    const convertOrderToShipment = (order: any): Shipment => ({
        ...order,
        status: capitalizeStatus(order.status) as ShipmentStatus,
    });

    const capitalizeStatus = (status: string): string => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    useEffect(() => {
        fetchAllShipments();
    }, []);

    // Get the current list based on active tab
    const getCurrentShipments = (): Shipment[] => {
        switch (activeTab) {
            case 'Pending': return pendingShipments;
            case 'Shipped': return shippedShipments;
            case 'Arrived': return arrivedShipments;
            case 'Archived': return archivedShipments;
            default: return [];
        }
    };

    const filteredShipments = getCurrentShipments();

    // Get total counts for each status
    const getCounts = () => ({
        Pending: pendingShipments.length,
        Shipped: shippedShipments.length,
        Arrived: arrivedShipments.length,
        Archived: archivedShipments.length,
    });

    const handleAction = (shipment: Shipment) => {
        setSelectedShipment(shipment);
        if (shipment.status === 'Pending') {
            setModalType('shipped');
            setCarrierName('');
            setTrackingNumber('');
        } else if (shipment.status === 'Shipped') {
            setModalType('arrived');
            // Default to now
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setArrivalDate(now.toISOString().slice(0, 16));
        } else if (shipment.status === 'Arrived') {
            handleMoveToArchive(shipment.id);
        }
    };

    const handleMoveToArchive = async (id: string) => {
        if (!window.confirm('Move this shipment to archive?')) return;
        
        // Optimistic update: Remove from Arrived, add to Archived
        const shipmentToArchive = arrivedShipments.find(s => s.id === id);
        if (!shipmentToArchive) return;

        setArrivedShipments(prev => prev.filter(s => s.id !== id));
        setArchivedShipments(prev => [...prev, { ...shipmentToArchive, status: 'Archived' }]);

        try {
            await archiveOrder(id);
            // Success toast is handled in adminService
        } catch (error) {
            // Rollback on error
            setArrivedShipments(prev => [...prev, shipmentToArchive]);
            setArchivedShipments(prev => prev.filter(s => s.id !== id));
        }
    };

    const submitShipped = async () => {
        if (!selectedShipment) return;
        
        // Optimistic update: Remove from Pending, add to Shipped
        const updatedShipment: Shipment = {
            ...selectedShipment,
            status: 'Shipped',
            carrierName,
            trackingNumber,
            shippedDate: new Date().toISOString(),
        };

        setPendingShipments(prev => prev.filter(s => s.id !== selectedShipment.id));
        setShippedShipments(prev => [...prev, updatedShipment]);
        setModalType(null);

        try {
            await shipOrder(selectedShipment.id, {
                carrier: carrierName,
                trackingNumber,
            });
            // Success toast is handled in adminService
        } catch (error) {
            // Rollback on error
            setPendingShipments(prev => [...prev, selectedShipment]);
            setShippedShipments(prev => prev.filter(s => s.id !== selectedShipment.id));
        }
    };

    const submitArrived = async () => {
        if (!selectedShipment) return;
        
        // Optimistic update: Remove from Shipped, add to Arrived
        const updatedShipment: Shipment = {
            ...selectedShipment,
            status: 'Arrived',
            arrivalDate: new Date(arrivalDate).toISOString(),
        };

        setShippedShipments(prev => prev.filter(s => s.id !== selectedShipment.id));
        setArrivedShipments(prev => [...prev, updatedShipment]);
        setModalType(null);

        try {
            const [datePart, timePart] = arrivalDate.split('T');
            await confirmArrival(selectedShipment.id, {
                arrivalDate: datePart,
                arrivalTime: timePart,
            });
            // Success toast is handled in adminService
        } catch (error) {
            // Rollback on error
            setShippedShipments(prev => [...prev, selectedShipment]);
            setArrivedShipments(prev => prev.filter(s => s.id !== selectedShipment.id));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div>
                <h2 className="text-3xl font-serif text-deep-black">Orders & Logistics</h2>
                <p className="text-gray-500 mt-1">Track shipments across the pipeline</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {STATUS_TABS.map((status) => {
                    const counts = getCounts();
                    return (
                        <button
                            key={status}
                            onClick={() => setActiveTab(status)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === status 
                                    ? 'border-champagne-gold text-deep-black' 
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {status === 'Pending' && <Package size={16} />}
                            {status === 'Shipped' && <Truck size={16} />}
                            {status === 'Arrived' && <CheckCircle size={16} />}
                            {status === 'Archived' && <Archive size={16} />}
                            {status.toUpperCase()}
                            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                {counts[status]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-sm"></div>
                    ))
                ) : filteredShipments.length > 0 ? (
                    filteredShipments.map((shipment) => (
                        <div key={shipment.id} className="bg-white border border-gray-100 p-6 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-6">
                                <div className="h-12 w-12 bg-gray-50 flex items-center justify-center text-champagne-gold font-serif text-lg">
                                    {shipment.orderId.substring(4)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-medium text-deep-black">{shipment.orderId}</h3>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <User size={12} /> {shipment.customerName}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                        {shipment.carrierName && (
                                            <span className="flex items-center gap-1"><Truck size={12} /> {shipment.carrierName}</span>
                                        )}
                                        {shipment.trackingNumber && (
                                            <span className="font-mono bg-gray-100 px-1 rounded">#{shipment.trackingNumber}</span>
                                        )}
                                        {shipment.arrivalDate && (
                                            <span className="flex items-center gap-1"><Calendar size={12} /> Arr: {new Date(shipment.arrivalDate).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {shipment.status !== 'Archived' && (
                                <button 
                                    onClick={() => handleAction(shipment)}
                                    className="flex items-center gap-2 px-4 py-2 border border-champagne-gold text-champagne-gold text-sm hover:bg-champagne-gold hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    {shipment.status === 'Pending' && 'Mark as Shipped'}
                                    {shipment.status === 'Shipped' && 'Confirm Arrival'}
                                    {shipment.status === 'Arrived' && 'Archive'}
                                    <ArrowRight size={16} />
                                </button>
                            )}
                             {shipment.status === 'Archived' && (
                                <span className="text-xs text-gray-400 italic">Completed</span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        No shipments in {activeTab} stage.
                    </div>
                )}
            </div>

            {/* Modals */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 w-full max-w-md shadow-2xl animate-scale-in">
                         <h3 className="text-xl font-serif mb-6 text-deep-black">
                             {modalType === 'shipped' ? 'Shipping Details' : 'Confirm Arrival'}
                         </h3>

                         {modalType === 'shipped' && (
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Carrier Name</label>
                                    <input 
                                        value={carrierName}
                                        onChange={(e) => setCarrierName(e.target.value)}
                                        className="w-full p-2 border border-gray-200 outline-none focus:border-champagne-gold"
                                        placeholder="FedEx, DHL, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tracking Number</label>
                                    <input 
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        className="w-full p-2 border border-gray-200 outline-none focus:border-champagne-gold"
                                        placeholder="TRACK123456"
                                    />
                                </div>
                             </div>
                         )}

                         {modalType === 'arrived' && (
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date & Time of Arrival</label>
                                    <input 
                                        type="datetime-local"
                                        value={arrivalDate}
                                        onChange={(e) => setArrivalDate(e.target.value)}
                                        className="w-full p-2 border border-gray-200 outline-none focus:border-champagne-gold"
                                    />
                                </div>
                             </div>
                         )}

                         <div className="flex justify-end gap-3 mt-8">
                             <button 
                                onClick={() => setModalType(null)}
                                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                             >
                                 Cancel
                             </button>
                             <button
                                onClick={modalType === 'shipped' ? submitShipped : submitArrived}
                                className="px-6 py-2 bg-deep-black text-white text-sm hover:bg-gray-800"
                             >
                                 Confirm
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logistics;

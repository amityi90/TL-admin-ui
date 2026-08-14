import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Archive, ArrowRight, User, Calendar } from 'lucide-react';
import type { Order, OrderStatus } from '../types/index';
import { fetchAllOrderLists, shipOrder, confirmArrival, archiveOrder } from '../api/adminService';

const STATUS_TABS: OrderStatus[] = ['pending', 'shipped', 'arrived', 'archived'];

const TAB_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending',
    shipped: 'Shipped',
    arrived: 'Arrived',
    archived: 'Archived',
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
    pending: 'Mark as Shipped',
    shipped: 'Confirm Arrival',
    arrived: 'Archive',
};

const emptyLists = (): Record<OrderStatus, Order[]> => ({
    pending: [],
    shipped: [],
    arrived: [],
    archived: [],
});

const formatMoney = (value: number) =>
    `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Logistics = () => {
    const [lists, setLists] = useState<Record<OrderStatus, Order[]>>(emptyLists());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<OrderStatus>('pending');

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalType, setModalType] = useState<'shipped' | 'arrived' | null>(null);

    const [carrierName, setCarrierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');

    const loadOrders = async () => {
        setLoading(true);
        try {
            setLists(await fetchAllOrderLists());
        } catch (error) {
            console.error('Failed to load orders:', error);
            // Error toast is already handled in adminService
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const counts = {
        pending: lists.pending.length,
        shipped: lists.shipped.length,
        arrived: lists.arrived.length,
        archived: lists.archived.length,
    };

    const visibleOrders = lists[activeTab];

    const handleAction = (order: Order) => {
        setSelectedOrder(order);
        if (order.status === 'pending') {
            setModalType('shipped');
            setCarrierName('');
            setTrackingNumber('');
        } else if (order.status === 'shipped') {
            setModalType('arrived');
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setArrivalDate(now.toISOString().slice(0, 16));
        } else if (order.status === 'arrived') {
            handleArchive(order);
        }
    };

    // Every mutation refetches rather than hand-patching four local arrays. The
    // server owns the transitions, so its answer is the one worth rendering.
    const runTransition = async (action: () => Promise<unknown>) => {
        try {
            await action();
        } catch (error) {
            console.error('Order transition failed:', error);
        } finally {
            setModalType(null);
            setSelectedOrder(null);
            await loadOrders();
        }
    };

    const handleArchive = (order: Order) => {
        if (!window.confirm('Move this order to archive?')) return;
        runTransition(() => archiveOrder(order.id));
    };

    const submitShipped = () => {
        if (!selectedOrder) return;
        if (!carrierName.trim() || !trackingNumber.trim()) {
            window.alert('Carrier and tracking number are both required.');
            return;
        }
        runTransition(() =>
            shipOrder(selectedOrder.id, {
                carrier: carrierName.trim(),
                trackingNumber: trackingNumber.trim(),
            })
        );
    };

    const submitArrived = () => {
        if (!selectedOrder) return;
        if (!arrivalDate) {
            window.alert('An arrival date and time is required.');
            return;
        }
        runTransition(() =>
            confirmArrival(selectedOrder.id, { arrivalAt: new Date(arrivalDate).toISOString() })
        );
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div>
                <h2 className="text-3xl font-serif text-deep-black">Orders &amp; Logistics</h2>
                <p className="text-gray-500 mt-1">Track shipments across the pipeline</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {STATUS_TABS.map((status) => (
                    <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === status
                                ? 'border-champagne-gold text-deep-black'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {status === 'pending' && <Package size={16} />}
                        {status === 'shipped' && <Truck size={16} />}
                        {status === 'arrived' && <CheckCircle size={16} />}
                        {status === 'archived' && <Archive size={16} />}
                        {TAB_LABELS[status].toUpperCase()}
                        <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                            {counts[status]}
                        </span>
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-sm"></div>
                    ))
                ) : visibleOrders.length > 0 ? (
                    visibleOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white border border-gray-100 p-6 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-12 w-12 bg-gray-50 flex items-center justify-center text-champagne-gold font-serif text-lg">
                                    {order.id}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-medium text-deep-black">Order #{order.id}</h3>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <User size={12} /> {order.fullName}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {order.items.length} item{order.items.length === 1 ? '' : 's'} &middot;{' '}
                                            {formatMoney(order.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                        <span>
                                            {order.city}, {order.postalCode}
                                        </span>
                                        {order.carrier && (
                                            <span className="flex items-center gap-1">
                                                <Truck size={12} /> {order.carrier}
                                            </span>
                                        )}
                                        {order.trackingNumber && (
                                            <span className="font-mono bg-gray-100 px-1 rounded">
                                                #{order.trackingNumber}
                                            </span>
                                        )}
                                        {order.arrivalAt && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} /> Arr:{' '}
                                                {new Date(order.arrivalAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {order.status !== 'archived' ? (
                                <button
                                    onClick={() => handleAction(order)}
                                    className="flex items-center gap-2 px-4 py-2 border border-champagne-gold text-champagne-gold text-sm hover:bg-champagne-gold hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    {ACTION_LABELS[order.status]}
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <span className="text-xs text-gray-400 italic">Completed</span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        No orders in {TAB_LABELS[activeTab]} stage.
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
                                    <label className="block text-sm font-medium mb-1">Date &amp; Time of Arrival</label>
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

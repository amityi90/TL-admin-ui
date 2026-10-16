import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Archive, ArrowRight, User, Calendar, Ban, ChevronRight } from 'lucide-react';
import type { Order, OrderStatus } from '../types/index';
import {
    fetchAllOrderLists,
    shipOrder,
    confirmArrival,
    archiveOrder,
    markOrderPaid,
    cancelOrder,
} from '../api/adminService';
import OrderDetail from '../components/OrderDetail';
import type { OrderAction } from '../components/OrderDetail';
import { formatUSD } from '../utils/money';

const STATUS_TABS: OrderStatus[] = ['pending', 'shipped', 'arrived', 'archived', 'cancelled'];

const TAB_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending',
    shipped: 'Shipped',
    arrived: 'Arrived',
    archived: 'Archived',
    cancelled: 'Cancelled',
};

const TAB_ICONS: Record<OrderStatus, typeof Package> = {
    pending: Package,
    shipped: Truck,
    arrived: CheckCircle,
    archived: Archive,
    cancelled: Ban,
};

const emptyLists = (): Record<OrderStatus, Order[]> => ({
    pending: [],
    shipped: [],
    arrived: [],
    archived: [],
    cancelled: [],
});

// The single next step offered on each card; the detail panel offers them all.
const quickAction = (order: Order): { action: OrderAction; label: string } | null => {
    if (order.status === 'pending') {
        return order.paymentStatus === 'Paid'
            ? { action: 'ship', label: 'Mark as Shipped' }
            : { action: 'markPaid', label: 'Mark as Paid' };
    }
    if (order.status === 'shipped') return { action: 'arrive', label: 'Confirm Arrival' };
    if (order.status === 'arrived') return { action: 'archive', label: 'Archive' };
    return null;
};

const Logistics = () => {
    const [lists, setLists] = useState<Record<OrderStatus, Order[]>>(emptyLists());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<OrderStatus>('pending');

    // The order open in the detail panel, by id, so it re-reads from the
    // freshly loaded lists after every action instead of showing stale data.
    const [detailId, setDetailId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

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

    const visibleOrders = lists[activeTab];
    const detailOrder =
        detailId === null
            ? null
            : STATUS_TABS.flatMap((status) => lists[status]).find((o) => o.id === detailId) ?? null;

    // Every mutation refetches rather than hand-patching local arrays. The
    // server owns the transitions, so its answer is the one worth rendering.
    const runTransition = async (action: () => Promise<unknown>) => {
        setBusy(true);
        try {
            await action();
        } catch (error) {
            console.error('Order transition failed:', error);
        } finally {
            setModalType(null);
            setSelectedOrder(null);
            await loadOrders();
            setBusy(false);
        }
    };

    const handleAction = (action: OrderAction, order: Order) => {
        switch (action) {
            case 'markPaid':
                if (!window.confirm(`Record payment of ${formatUSD(order.totalAmount)} for order #${order.id}?`)) return;
                runTransition(() => markOrderPaid(order.id));
                break;
            case 'ship':
                setSelectedOrder(order);
                setCarrierName('');
                setTrackingNumber('');
                setModalType('shipped');
                break;
            case 'arrive': {
                setSelectedOrder(order);
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                setArrivalDate(now.toISOString().slice(0, 16));
                setModalType('arrived');
                break;
            }
            case 'archive':
                if (!window.confirm('Move this order to archive?')) return;
                runTransition(() => archiveOrder(order.id));
                break;
            case 'cancel':
                if (
                    !window.confirm(
                        `Cancel order #${order.id}? Its ${order.items.length === 1 ? 'item returns' : 'items return'} to stock. This cannot be undone.`
                    )
                )
                    return;
                runTransition(() => cancelOrder(order.id));
                break;
        }
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
                <p className="text-gray-500 mt-1">Click an order to see its items and buyer details</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {STATUS_TABS.map((status) => {
                    const Icon = TAB_ICONS[status];
                    return (
                        <button
                            key={status}
                            onClick={() => setActiveTab(status)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === status
                                    ? 'border-champagne-gold text-deep-black'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <Icon size={16} />
                            {TAB_LABELS[status].toUpperCase()}
                            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                {lists[status].length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading && visibleOrders.length === 0 ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-sm"></div>
                    ))
                ) : visibleOrders.length > 0 ? (
                    visibleOrders.map((order) => {
                        const next = quickAction(order);
                        const isPaid = order.paymentStatus === 'Paid';
                        return (
                            <div
                                key={order.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setDetailId(order.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setDetailId(order.id);
                                    }
                                }}
                                className="bg-white border border-gray-100 p-6 flex justify-between items-center gap-6 shadow-sm hover:shadow-md hover:border-champagne-gold/40 transition-all group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-champagne-gold"
                            >
                                <div className="flex items-center gap-6 min-w-0">
                                    <div className="h-12 w-12 shrink-0 bg-gray-50 flex items-center justify-center text-champagne-gold font-serif text-lg">
                                        {order.id}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-medium text-deep-black">Order #{order.id}</h3>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <User size={12} /> {order.fullName}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {order.items.length} item{order.items.length === 1 ? '' : 's'} &middot;{' '}
                                                {formatUSD(order.totalAmount)}
                                            </span>
                                            {order.status !== 'cancelled' && (
                                                <span
                                                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 ${
                                                        isPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {isPaid ? 'Paid' : 'Payment pending'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-4 flex-wrap">
                                            <span>
                                                {order.city}, {order.postalCode}
                                                {order.country ? `, ${order.country}` : ''}
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

                                <div className="flex items-center gap-3 shrink-0">
                                    {next ? (
                                        <button
                                            onClick={(e) => {
                                                // The card itself opens the detail panel.
                                                e.stopPropagation();
                                                handleAction(next.action, order);
                                            }}
                                            disabled={busy}
                                            className="flex items-center gap-2 px-4 py-2 border border-champagne-gold text-champagne-gold text-sm hover:bg-champagne-gold hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
                                        >
                                            {next.label}
                                            <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">
                                            {order.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                        </span>
                                    )}
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-champagne-gold transition-colors" />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        No orders in {TAB_LABELS[activeTab]} stage.
                    </div>
                )}
            </div>

            {detailOrder && (
                <OrderDetail
                    order={detailOrder}
                    busy={busy}
                    onClose={() => setDetailId(null)}
                    onAction={handleAction}
                />
            )}

            {/* Modals - above the detail panel, which opens them */}
            {modalType && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 w-full max-w-md shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-serif mb-6 text-deep-black">
                            {modalType === 'shipped' ? 'Shipping Details' : 'Confirm Arrival'}
                            {selectedOrder && <span className="text-gray-400"> · Order #{selectedOrder.id}</span>}
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
                                        autoFocus
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
                                disabled={busy}
                                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={modalType === 'shipped' ? submitShipped : submitArrived}
                                disabled={busy}
                                className="px-6 py-2 bg-deep-black text-white text-sm hover:bg-gray-800 disabled:opacity-40"
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

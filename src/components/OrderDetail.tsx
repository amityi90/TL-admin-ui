import { useEffect } from 'react';
import {
    X,
    Mail,
    Phone,
    MapPin,
    Truck,
    Calendar,
    CreditCard,
    CheckCircle,
    Archive,
    Ban,
    Package,
    Loader2,
} from 'lucide-react';
import type { Order, OrderStatus } from '../types/index';
import { formatUSD } from '../utils/money';

export type OrderAction = 'markPaid' | 'ship' | 'arrive' | 'archive' | 'cancel';

interface OrderDetailProps {
    order: Order;
    onClose: () => void;
    onAction: (action: OrderAction, order: Order) => void;
    busy?: boolean;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
    pending: 'bg-amber-50 text-amber-700',
    shipped: 'bg-blue-50 text-blue-700',
    arrived: 'bg-green-50 text-green-700',
    archived: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-50 text-red-600',
};

const countryNames = (() => {
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
        return null;
    }
})();

// Orders store ISO codes ("US"); show the name, falling back to the code.
const countryName = (code?: string | null): string | null => {
    if (!code) return null;
    try {
        return countryNames?.of(code.toUpperCase()) || code;
    } catch {
        return code;
    }
};

const formatDateTime = (value?: string | null) =>
    value
        ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : null;

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-bold text-champagne-gold uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
        {children}
    </h3>
);

const OrderDetail = ({ order, onClose, onAction, busy = false }: OrderDetailProps) => {
    // Escape closes the panel, like the product form's overlay click.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const isPaid = order.paymentStatus === 'Paid';
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const country = countryName(order.country);
    const shippingAmount = Number(order.shippingAmount) || 0;
    const chosenShipping = [order.shippingCarrier, order.shippingService]
        .filter((part, i, parts) => part && (i === 0 || part !== parts[0]))
        .join(' — ');

    const actionButton = (
        action: OrderAction,
        label: string,
        Icon: typeof Truck,
        variant: 'primary' | 'outline' | 'danger' = 'outline',
        disabled = false,
        title?: string
    ) => {
        const styles = {
            primary: 'bg-deep-black text-white hover:bg-gray-800 border border-deep-black',
            outline: 'border border-champagne-gold text-champagne-gold hover:bg-champagne-gold hover:text-white',
            danger: 'border border-red-200 text-red-500 hover:bg-red-50',
        }[variant];
        return (
            <button
                type="button"
                onClick={() => onAction(action, order)}
                disabled={busy || disabled}
                title={title}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles}`}
            >
                <Icon size={14} />
                {label}
            </button>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Order #${order.id}`}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-serif text-deep-black tracking-wide">Order #{order.id}</h2>
                            <p className="text-xs text-gray-500 mt-1">Placed {formatDateTime(order.createdAt)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-deep-black transition-colors rounded-full p-1 hover:bg-gray-100"
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${STATUS_STYLES[order.status]}`}>
                            {order.status}
                        </span>
                        <span
                            className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${
                                isPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}
                        >
                            {isPaid ? 'Paid' : 'Payment pending'}
                        </span>
                        <span className="px-2.5 py-1 text-xs text-gray-500 bg-gray-50">{order.paymentMethod}</span>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Buyer */}
                    <section>
                        <SectionTitle>Buyer</SectionTitle>
                        <p className="text-lg text-deep-black font-medium mb-3">{order.fullName}</p>
                        <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-center gap-3">
                                <Mail size={15} className="text-gray-400 shrink-0" />
                                {order.email ? (
                                    <a href={`mailto:${order.email}`} className="hover:text-champagne-gold break-all">
                                        {order.email}
                                    </a>
                                ) : (
                                    <span className="text-gray-400">No email given</span>
                                )}
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={15} className="text-gray-400 shrink-0" />
                                <a href={`tel:${order.phone}`} className="hover:text-champagne-gold">
                                    {order.phone}
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                                <span>
                                    {order.address}
                                    <br />
                                    {[order.city, order.state, order.postalCode].filter(Boolean).join(' ')}
                                    {country && (
                                        <>
                                            <br />
                                            {country}
                                        </>
                                    )}
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Items */}
                    <section>
                        <SectionTitle>
                            Items ({itemCount} {itemCount === 1 ? 'piece' : 'pieces'})
                        </SectionTitle>
                        <ul className="divide-y divide-gray-100">
                            {order.items.map((item) => (
                                <li key={item.id} className="flex items-center gap-4 py-3">
                                    <div className="h-14 w-14 bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {item.images?.[0] ? (
                                            <img src={item.images[0]} alt={item.name ?? ''} className="h-full w-full object-cover" />
                                        ) : (
                                            <Package size={18} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-deep-black truncate">
                                            {item.name ?? 'Deleted product'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {item.quantity} × {formatUSD(item.unitPrice)}
                                            {item.productId === null && ' · no longer in catalogue'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-medium text-deep-black">
                                        {formatUSD(item.unitPrice * item.quantity)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t border-gray-200 pt-3 mt-1 space-y-1.5 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatUSD(order.totalAmount - shippingAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping{chosenShipping && ` (${chosenShipping})`}</span>
                                <span>{shippingAmount === 0 ? 'Free' : formatUSD(shippingAmount)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-baseline pt-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total (USD)</span>
                            <span className="text-xl font-serif text-deep-black">{formatUSD(order.totalAmount)}</span>
                        </div>
                    </section>

                    {/* Shipping */}
                    <section>
                        <SectionTitle>Shipping</SectionTitle>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
                            {chosenShipping && (
                                <>
                                    <dt className="text-gray-500 flex items-center gap-2"><CreditCard size={14} /> Customer chose</dt>
                                    <dd className="text-deep-black">
                                        {chosenShipping}
                                        {order.shippingEstDuties != null && order.shippingEstDuties > 0 && (
                                            <span className="block text-xs text-gray-400">
                                                Est. duties {formatUSD(order.shippingEstDuties)}, paid by recipient
                                            </span>
                                        )}
                                    </dd>
                                </>
                            )}
                            <dt className="text-gray-500 flex items-center gap-2"><Truck size={14} /> Carrier</dt>
                            <dd className="text-deep-black">{order.carrier || '—'}</dd>
                            <dt className="text-gray-500 flex items-center gap-2"><Package size={14} /> Tracking</dt>
                            <dd className="text-deep-black font-mono">{order.trackingNumber || '—'}</dd>
                            <dt className="text-gray-500 flex items-center gap-2"><Calendar size={14} /> Arrived</dt>
                            <dd className="text-deep-black">{formatDateTime(order.arrivalAt) || '—'}</dd>
                        </dl>
                    </section>

                    {/* Payment reference, when a provider issued one */}
                    {order.paymentReference && (
                        <p className="text-xs text-gray-400">
                            Payment reference: <span className="font-mono">{order.paymentReference}</span>
                            {order.paymentProvider && ` (${order.paymentProvider})`}
                        </p>
                    )}
                </div>

                {/* Actions for the current stage */}
                {order.status !== 'archived' && order.status !== 'cancelled' && (
                    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-6 flex flex-wrap gap-3 justify-end">
                        {busy && <Loader2 size={18} className="animate-spin text-gray-400 self-center mr-auto" />}
                        {!isPaid && actionButton('markPaid', 'Mark as Paid', CreditCard, 'primary')}
                        {order.status === 'pending' &&
                            actionButton(
                                'ship',
                                'Mark as Shipped',
                                Truck,
                                isPaid ? 'primary' : 'outline',
                                !isPaid,
                                isPaid ? undefined : 'Record the payment before shipping'
                            )}
                        {order.status === 'shipped' && actionButton('arrive', 'Confirm Arrival', CheckCircle, 'primary')}
                        {order.status === 'arrived' && actionButton('archive', 'Archive', Archive, 'primary')}
                        {order.status === 'pending' && actionButton('cancel', 'Cancel Order', Ban, 'danger')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetail;

/**
 * One list of payment methods for every order/sale screen.
 * Values are what the database holds (checked 2026-11-23: cashOnDelivery, cash, online, bkash).
 * The storefront writes `online` and `cashOnDelivery`; showroom sales write the others.
 */
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cashOnDelivery', label: 'Cash on Delivery' },
  { value: 'online', label: 'Online' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bankTransfer', label: 'Bank Transfer' },
  { value: 'cardPayment', label: 'Card' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

/** For list filters: "All methods" first */
export const PAYMENT_METHOD_FILTERS = [{ value: 'ALL', label: 'All methods' }, ...PAYMENT_METHODS] as const;
export type PaymentMethodFilter = (typeof PAYMENT_METHOD_FILTERS)[number]['value'];

// Names older admin screens offered; no order uses them today, but show them properly if one appears.
const LEGACY_LABELS: Record<string, string> = {
  onlinePayment: 'Online',
  bkashPayment: 'bKash',
  bkashPersonal: 'bKash (personal)',
  nagadPayment: 'Nagad',
  nagadPersonal: 'Nagad (personal)',
  rocketPayment: 'Rocket',
  rocketPersonal: 'Rocket (personal)',
};

export const isPaymentMethod = (v: unknown): v is PaymentMethod =>
  typeof v === 'string' && PAYMENT_METHODS.some((m) => m.value === v);

export const toMethodFilter = (v: string): PaymentMethodFilter =>
  PAYMENT_METHOD_FILTERS.find((m) => m.value === v)?.value ?? 'ALL';

/** "cashOnDelivery" -> "Cash on Delivery"; unknown values are shown as they are */
export const paymentMethodLabel = (m?: string | null): string => {
  if (!m) return '—';
  return PAYMENT_METHODS.find((x) => x.value === m)?.label ?? LEGACY_LABELS[m] ?? m;
};

/** Cash on delivery: the courier collects, Steadfast charges 1% (same rule as the backend Finance) */
export const isCashOnDelivery = (m?: string | null) => {
  const v = String(m || '').toLowerCase();
  return v === 'cashondelivery' || v === 'cod';
};

// Orders as the backend sends them (Prisma `Order` + the relations the admin endpoints include).
// Dates arrive as ISO strings. Keep in step with khushbuwaala-backend/prisma/schema.prisma.

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELED' | 'RETURNED';
export type OrderSource = 'WEBSITE' | 'SHOWROOM' | 'WHOLESALE' | 'MANUAL';
export type SaleType = 'SINGLE' | 'BULK';

export const ORDER_STATUSES: readonly OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELED', 'RETURNED'];
export const isOrderStatus = (v: unknown): v is OrderStatus => typeof v === 'string' && (ORDER_STATUSES as readonly string[]).includes(v);

export type AddressInfo = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  district?: string | null;
  thana?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

/** One order line (CartItem). `product` / `variant` are included by the admin endpoints. */
export type OrderLine = {
  id: string;
  userId?: string | null;
  productId: string;
  variantId?: string | null;
  size?: number | null;
  unit?: string | null;
  quantity: number;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  status?: 'IN_CART' | 'ORDERED' | 'SOLD';
  orderId?: string | null;
  product?: {
    id: string;
    name: string;
    primaryImage?: string;
    slug?: string;
    stock?: number;
    unit?: string;
  } | null;
  variant?: {
    id: string;
    productId: string;
    sku: string;
    unit: string;
    size: number;
    price: number;
  } | null;
};

/** Older orders also keep a JSON copy of the lines (`Order.cartItems`); its fields vary by age. */
export type OrderJsonLine = {
  id?: string;
  productId?: string;
  name?: string;
  size?: number | string | null;
  unit?: string | null;
  quantity?: number;
  qty?: number;
  price?: number;
  product?: { name?: string } | null;
};

/** A line in the order edit form. New lines get a "temp_" id until saved. */
export type EditableOrderLine = {
  id: string;
  productId: string;
  variantId: string | null;
  size: number;
  unit: string;
  quantity: number;
  price: number;
  product?: { name?: string; primaryImage?: string } | null;
};
export type EditableLineField = 'size' | 'unit' | 'price' | 'quantity';

type LineInput = {
  id?: string;
  productId?: string;
  variantId?: string | null;
  size?: number | string | null;
  unit?: string | null;
  quantity?: number;
  qty?: number;
  price?: number;
  product?: { id?: string; name?: string; primaryImage?: string } | null;
};

/** Real lines, or the JSON copy older orders kept (those have no id: they are saved as new lines). */
export const toEditableLines = (lines: LineInput[] = [], defaultUnit = 'ML'): EditableOrderLine[] =>
  lines.map((it, idx) => ({
    id: it.id ?? `temp_copy_${idx}`,
    productId: it.productId ?? it.product?.id ?? '',
    variantId: it.variantId ?? null,
    size: Number(it.size ?? 1),
    unit: it.unit ?? defaultUnit,
    quantity: Number(it.quantity ?? it.qty ?? 1),
    price: Number(it.price ?? 0),
    product: it.product ?? null,
  }));

const finiteOr0 = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/** A new line for a product (variant optional: some products have none). */
export const newEditableLine = (
  prod: { id: string; name: string; primaryImage?: string },
  variant?: { id: string; size: number; unit: string; price: number } | null,
): EditableOrderLine => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  productId: prod.id,
  // never a placeholder id: the database only takes real ids (a fake one made the save fail)
  variantId: variant?.id ?? null,
  size: Number(variant?.size ?? 1),
  unit: variant?.unit ?? 'ML',
  quantity: 1,
  price: Number(variant?.price ?? 0),
  product: { name: prod.name, primaryImage: prod.primaryImage || '/placeholder.png' },
});

/** What PATCH /order/update-order expects for each line */
export const editableLinePayload = (it: EditableOrderLine) => ({
  id: it.id.startsWith('temp_') ? undefined : it.id,
  productId: it.productId,
  variantId: it.variantId,
  size: finiteOr0(it.size),
  unit: String(it.unit ?? '').trim(),
  quantity: Math.max(1, Math.floor(finiteOr0(it.quantity))),
  price: finiteOr0(it.price),
});

/** What a list needs to show a line, whether it is a real line or an older JSON copy */
export type DisplayLine = {
  name?: string;
  product?: { name?: string } | null;
  size?: number | string | null;
  unit?: string | null;
  quantity?: number;
  qty?: number;
  price?: number;
  amount?: number;
  variant?: { size?: number; unit?: string } | null;
};

/** Lines to show for an order: its real lines, else the JSON copy older orders kept */
export const orderDisplayLines = (o: Pick<Order, 'orderItems' | 'cartItems'>): DisplayLine[] =>
  o.orderItems?.length ? o.orderItems : o.cartItems || o.orderItems || [];

/** Finance snapshot of one line (OrderItemCost). The list endpoint may send only `{ profit }`. */
export type OrderItemCostRow = {
  id?: string;
  orderId?: string;
  cartItemId?: string | null;
  productId?: string | null;
  variantId?: string | null;
  quantity?: number;
  sellingUnitPrice?: number;
  liquidUnitCost?: number;
  packagingUnitCost?: number;
  unitCost?: number;
  totalCost?: number;
  totalRevenue?: number;
  profit: number;
  costMissing?: boolean;
};

export type OrderCustomer = {
  id: string | null;
  name: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  imageUrl?: string | null;
};

export type Order = {
  id: string;
  invoice: string;
  orderTime: string;
  payToken?: string | null;
  amount: number;
  isPaid: boolean;
  method?: string | null;
  cartItems?: OrderJsonLine[] | null;
  status: OrderStatus;
  orderSource: OrderSource;
  platform?: string | null;
  productIds?: string[];
  coupon?: string | null;
  discountAmount?: number;
  customerId?: string | null;
  customer?: OrderCustomer | null;
  shippingCost?: number;
  additionalNotes?: string | null;
  shipping?: AddressInfo | null;
  billing?: AddressInfo | null;
  salesmanId?: string | null;
  salesman?: { id: string; name: string; email?: string | null; imageUrl?: string | null } | null;
  saleType?: SaleType | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  orderItems?: OrderLine[];
  orderItemCosts?: OrderItemCostRow[];

  // Steadfast courier
  consignmentId?: number | null;
  trackingCode?: string | null;
  trackingLink?: string | null;
  deliveryCharge?: number | null;
  courierStatus?: string | null;
  stockReturned?: boolean;
  returnChargeCollected?: number | null;
  courierPayoutId?: string | null;
  courierPaidAt?: string | null;
  courierCodCollected?: number | null;
  courierReview?: string | null;
  courierSyncedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = { page: number; limit: number; total: number; totalPage?: number };

/** `summary` of GET /order/get-all-orders (same formula as Finance) */
export type OrderListSummary = {
  totalCount: number;
  totalValidCount: number;
  totalCodAmount: number;
  totalBillAmount: number;
  totalRcvAmount: number;
  paidCount: number;
  dueCount: number;
};

export type OrderListResponse = {
  success: boolean;
  message?: string;
  meta: PaginationMeta;
  summary?: OrderListSummary;
  data: Order[];
};

/** Query string for the order and sale lists (all optional; blank values are dropped by the page). */
export type OrderListQuery = {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: string;
  payment?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  orderSource?: string;
  saleType?: string;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
};

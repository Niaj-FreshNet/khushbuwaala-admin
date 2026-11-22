'use client';

/**
 * Courier returns (owner's rule, D-025). When a parcel that went out with the courier comes back:
 *  - CANCELED = customer refused but paid the delivery charge to the rider (Steadfast "partial delivered")
 *  - RETURNED = customer refused and did not pay (the courier fee is our loss)
 * Before saving either status on a courier order, ask what the customer paid, so Finance shows the
 * real result (collected − courier fee). Steadfast's webhook fills this in by itself when it arrives.
 */
import { useCallback } from 'react';
import { usePrompt } from '@/components/admin/ConfirmProvider';

type OrderLike = {
  status?: string | null;
  orderSource?: string | null;
  consignmentId?: number | string | null;
  shippingCost?: number | null;
  returnChargeCollected?: number | null;
};

/** Sent with the courier, or already on its way: a cancel/return now means the parcel comes back. */
export const isCourierOrder = (o?: OrderLike | null) =>
  !!o && o.orderSource !== 'SHOWROOM' && (!!o.consignmentId || ['SHIPPED', 'DELIVERED'].includes(String(o.status || '').toUpperCase()));

/**
 * Returns undefined = nothing to ask (send status only), null = user cancelled (do nothing),
 * or { returnChargeCollected } to send with the status (null value = not a courier return).
 */
export function useCourierReturnPrompt() {
  const ask = usePrompt();
  return useCallback(
    async (order: OrderLike | null | undefined, nextStatus: string): Promise<{ returnChargeCollected: number | null } | null | undefined> => {
      const next = String(nextStatus).toUpperCase();
      if ((next !== 'CANCELED' && next !== 'RETURNED') || !isCourierOrder(order)) return undefined;
      const paid = next === 'CANCELED';
      const preset = order?.returnChargeCollected ?? (paid ? Number(order?.shippingCost) || 0 : 0);
      const value = await ask({
        title: paid ? 'Parcel came back: delivery charge paid?' : 'Parcel came back unpaid?',
        description: paid
          ? 'Customer refused the product but paid the delivery charge to the rider. Enter what they paid (Steadfast: partial delivered). Leave empty if the order was cancelled before it went to the courier.'
          : 'Customer refused and did not pay, so the courier fee is a loss. Enter an amount only if they paid something.',
        label: 'Delivery charge the customer paid (৳)',
        inputType: 'number',
        defaultValue: String(preset),
        confirmText: paid ? 'Mark cancelled' : 'Mark returned',
      });
      if (value === null) return null;
      if (value.trim() === '') return { returnChargeCollected: null };
      const n = Number(value);
      return { returnChargeCollected: Number.isFinite(n) && n >= 0 ? n : 0 };
    },
    [ask]
  );
}

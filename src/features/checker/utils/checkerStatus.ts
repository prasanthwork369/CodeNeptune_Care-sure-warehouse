import { ORDER_STATUS } from "@/src/features/picker/constants/order.constants";
import { ApiStatusLog } from "@/src/features/picker/types/order.types";

export interface CheckableOrder {
  rawStatus?: number;
  statusLogs?: ApiStatusLog[];
  status?: any;
}

/**
 * Distinguishes an already-CHECKED order (status 5) from orders that have not yet been checked
 * or are in other states.
 */
export const isOrderAlreadyChecked = (
  order: CheckableOrder | null | undefined,
): boolean => {
  if (!order) return false;
  if (order.rawStatus !== undefined) {
    return Number(order.rawStatus) === ORDER_STATUS.CHECKED;
  }
  if (typeof order.status === "number") {
    return order.status === ORDER_STATUS.CHECKED;
  }
  if (Array.isArray(order.statusLogs) && order.statusLogs.length > 0) {
    const lastLog = order.statusLogs[order.statusLogs.length - 1];
    return Number(lastLog?.toStatus) === ORDER_STATUS.CHECKED;
  }
  return false;
};

/**
 * Whether OrderSummaryLayout shows the checking UI for this order — the same
 * gates it renders with: found, not already CHECKED, and 'partial' (PICKED).
 */
export const canStartChecking = (
  order: CheckableOrder | null | undefined,
): boolean =>
  !!order && !isOrderAlreadyChecked(order) && order.status === "partial";

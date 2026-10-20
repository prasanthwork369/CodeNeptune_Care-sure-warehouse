import { ORDER_STATUS } from "@/src/features/picker/constants/order.constants";
import { ApiOrder } from "@/src/features/picker/types/order.types";
import { isSameLocalDay } from "@/src/utils/dateUtils";

// Dispatcher business rules (unchanged): SHIPPED/DELIVERED → Dispatched,
// DISPATCHER_CANCEL → Dispatch Failed.
const DISPATCHED_STATUSES: number[] = [
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

export const isDispatchedOrder = (o: ApiOrder) =>
  DISPATCHED_STATUSES.includes(Number(o.status));

export const isDispatchFailedOrder = (o: ApiOrder) =>
  Number(o.status) === ORDER_STATUS.DISPATCHER_CANCEL;

/**
 * When the order reached its dispatcher outcome: the latest status log into
 * SHIPPED (for dispatched orders) or DISPATCHER_CANCEL (for failed ones), else
 * updatedAt, else createdAt. createdAt alone is the order placement time, so an
 * order placed on an earlier day but dispatched today was wrongly excluded.
 */
export const getDispatchEventDate = (o: ApiOrder): string | undefined => {
  const target = isDispatchFailedOrder(o)
    ? ORDER_STATUS.DISPATCHER_CANCEL
    : ORDER_STATUS.SHIPPED;
  const log = Array.isArray(o.statusLogs)
    ? [...o.statusLogs].reverse().find((l) => Number(l?.toStatus) === target)
    : undefined;
  return log?.createdAt || o.updatedAt || o.createdAt;
};

export const isDispatchEventOn = (o: ApiOrder, day: Date) => {
  const date = getDispatchEventDate(o);
  return date ? isSameLocalDay(date, day) : false;
};

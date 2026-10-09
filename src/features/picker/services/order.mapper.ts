import {
  ApiOrder,
  Order,
  OrderItem,
  PickedStatusEvent,
} from "../types/order.types";
import {
  formatTimeAgo,
  formatOrderDate,
  formatExpiryDate,
} from "../../../utils/dateUtils";
import { ORDER_STATUS } from "../constants/order.constants";

export const mapOrder = (apiOrder: ApiOrder): Order => {
  const medicineNames =
    apiOrder.items?.map((it) => it.medicineSnapshot.name) || [];
  const uniqueNames = Array.from(new Set(medicineNames));
  const medicineSlug = uniqueNames.join(", ") || "No items";

  const pickingItems: OrderItem[] =
    apiOrder.items?.map((it) => ({
      id: it.id,
      medicineId: it.medicineId,
      name: it.medicineSnapshot.name,
      requiredQty: it.quantity,
      pickedQty: 0,
      status: it.status.toLowerCase() as any,
      image:
        it.medicineSnapshot.thumbnailUrl ||
        (it.medicineSnapshot as any).imageUrl ||
        (it.medicineSnapshot as any).image ||
        undefined,
      batchNo: it.batchNumber,
      expiryDate: it.expiryDate ? formatExpiryDate(it.expiryDate) : undefined,
      fulfillmentType: it.fulfillmentType as any,
    })) || [];

  const orderImages =
    (apiOrder.items
      ?.map(
        (it) =>
          it.medicineSnapshot.thumbnailUrl ||
          (it.medicineSnapshot as any).imageUrl ||
          (it.medicineSnapshot as any).image,
      )
      .filter(Boolean) as string[]) || [];

  const PICKED_STATUSES = new Set(["picked", "packed"]);
  const pickedCount =
    apiOrder.items?.filter((it) => PICKED_STATUSES.has(it.status.toLowerCase()))
      .length ?? 0;
  const totalCount = apiOrder.items?.length ?? 0;
  const outOfStockMeds =
    apiOrder.items
      ?.filter((it) => !PICKED_STATUSES.has(it.status.toLowerCase()))
      .map((it) => it.medicineSnapshot.name) ?? [];

  // ── Derive "Picked" step from statusLogs where toStatus === "4" (PICKED) ──
  const pickedLogs = Array.isArray(apiOrder.statusLogs)
    ? apiOrder.statusLogs.filter(
        (log) =>
          String(log?.toStatus) === "4" ||
          Number(log?.toStatus) === ORDER_STATUS.PICKED,
      )
    : [];
  const pickedLog =
    pickedLogs.length > 0 ? pickedLogs[pickedLogs.length - 1] : undefined;

  const pickedBy = pickedLog
    ? [pickedLog.performedByFirstName, pickedLog.performedByLastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      pickedLog.performedByRole ||
      undefined
    : undefined;

  const pickedAt = pickedLog?.createdAt;
  const pickedReason = pickedLog?.reason;
  const pickedByRole = pickedLog?.performedByRole;
  const completionDate = pickedLog?.createdAt
    ? formatOrderDate(pickedLog.createdAt)
    : undefined;

  const pickedEvent: PickedStatusEvent | undefined = pickedLog
    ? {
        createdAt: pickedLog.createdAt,
        reason: pickedLog.reason,
        performedByFirstName: pickedLog.performedByFirstName,
        performedByLastName: pickedLog.performedByLastName,
        performedByRole: pickedLog.performedByRole,
      }
    : undefined;

  return {
    id: apiOrder.id,
    orderId: apiOrder.orderId,
    customerName: apiOrder.customer
      ? [apiOrder.customer.firstName, apiOrder.customer.lastName]
          .filter(Boolean)
          .join(" ") || "N/A"
      : "N/A",
    orderDate: formatOrderDate(apiOrder.createdAt),
    timeAgo: formatTimeAgo(apiOrder.createdAt),
    medicineSlug,
    status:
      apiOrder.status === ORDER_STATUS.PACKED
        ? "completed"
        : apiOrder.status === ORDER_STATUS.PICKED ||
            apiOrder.status === ORDER_STATUS.PARTIALLY_PICKED
          ? "partial"
          : "new",
    totalItems:
      apiOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    items: medicineNames,
    images: orderImages.slice(0, 4),
    pickingItems,
    date: apiOrder.createdAt,
    completionDate,
    outOfStockMeds,
    pickedCount,
    totalCount,
    stockStatus: outOfStockMeds.length === 0 ? "available" : "waiting",
    pickedBy,
    pickedAt,
    pickedReason,
    pickedByRole,
    pickedEvent,
    statusLogs: apiOrder.statusLogs,
  };
};

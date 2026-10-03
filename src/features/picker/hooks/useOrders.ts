import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshQueries } from "@/src/lib/refreshQueries";
import { orderService } from '@/src/features/picker/services/order.service';
import { toAppError } from "@/src/api/errors";
import { useNotificationStore } from "@/src/store/useNotificationStore";
import { ListOrdersParams } from '@/src/features/picker/types/order.types';

// No polling: kept fresh by order socket events, reconnect resync and
// mutation refreshes (useSyncFulfillment / useFulfillmentActions)
export const useOrdersQuery = (params?: ListOrdersParams) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderService.list(params),
  });
};

export const useOrdersDetailedQuery = (params?: ListOrdersParams) => {
  return useQuery({
    queryKey: ["orders", "detailed", params],
    queryFn: () => orderService.listDetailed(params),
  });
};

export const useOrderDetailQuery = (orderId: string) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderService.getById(orderId),
    enabled: !!orderId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: number;
      reason?: string;
    }) => orderService.updateStatus(id, status, reason),
    onSuccess: () => {
      refreshQueries(queryClient, ["orders"]);
      addNotification({
        title: "Status updated",
        message: "Order status has been updated.",
        type: "success",
      });
    },
    onError: (error) => {
      addNotification({
        title: "Update failed",
        message: toAppError(error).message,
        type: "error",
      });
    },
  });
};

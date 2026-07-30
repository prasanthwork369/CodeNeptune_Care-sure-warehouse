import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import { toAppError } from "../api/errors";
import { useNotificationStore } from "../store/useNotificationStore";
import { ListOrdersParams } from "../types/order.types";

export const useOrdersQuery = (params?: ListOrdersParams) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderService.list(params),
    refetchInterval: 15000, // 15s polling fallback when socket events are missed
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
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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

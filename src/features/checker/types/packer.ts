import { Order } from "@/src/features/picker/types/order.types";

export interface PackedOrderCardProps {
  order: Order;
  isLast?: boolean;
}

import { useLocalSearchParams } from "expo-router";
import OrderPickingView from "@/src/components/picking/OrderPickingView";

export default function OrderDetailsScreen() {
  const { id, expiresAt, orderId } = useLocalSearchParams<{
    id: string;
    expiresAt: string;
    orderId: string;
  }>();

  return (
    <OrderPickingView
      orderId={id}
      expiresAt={expiresAt}
      displayOrderId={orderId}
    />
  );
}

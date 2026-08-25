import { useLocalSearchParams } from "expo-router";
import { OrderPickingLayout } from "@/src/features/picker/screens/OrderPickingLayout";

export default function OrderDetailsScreen() {
  const { id, expiresAt, orderId } = useLocalSearchParams<{
    id: string;
    expiresAt: string;
    orderId: string;
  }>();

  return (
    <OrderPickingLayout
      orderId={id}
      expiresAt={expiresAt}
      displayOrderId={orderId}
    />
  );
}

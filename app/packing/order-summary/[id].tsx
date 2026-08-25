import { useLocalSearchParams } from "expo-router";
import { OrderSummaryLayout } from "@/src/features/checker/screens/OrderSummaryLayout";

export default function OrderSummaryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <OrderSummaryLayout orderId={id} />;
}

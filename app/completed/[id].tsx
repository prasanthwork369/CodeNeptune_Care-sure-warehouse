import { useLocalSearchParams } from "expo-router";
import { CompletedOrderLayout } from "@/src/features/picker/screens/CompletedOrderLayout";

export default function CompletedDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <CompletedOrderLayout orderId={id} />;
}

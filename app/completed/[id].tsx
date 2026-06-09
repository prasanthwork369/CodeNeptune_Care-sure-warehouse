import { useLocalSearchParams } from 'expo-router';
import CompletedOrderView from '@/src/components/completed/CompletedOrderView';

export default function CompletedDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return <CompletedOrderView orderId={id} />;
}

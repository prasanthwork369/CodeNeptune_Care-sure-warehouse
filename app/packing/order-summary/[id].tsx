import { useLocalSearchParams } from 'expo-router';
import OrderSummaryView from '@/src/components/packer/sections/OrderSummaryView';

export default function OrderSummaryRoute() {
    const { id } = useLocalSearchParams();
    return <OrderSummaryView orderId={id as string} />;
}

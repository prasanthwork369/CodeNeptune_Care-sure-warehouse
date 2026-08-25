export interface DispatcherOrderCardProps {
  id: string;
  idDisplay?: string;
  customerName: string;
  reviewedOn: string;
  onPress?: () => void;
}

export interface DispatchedOrder {
  id: string;
  orderId: string;
  deliveryType: string;
  status: number;
  total: string;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: string;
    medicineSnapshot: {
      name: string;
      slug: string;
      thumbnailUrl: string;
    };
    quantity: number;
    status: string;
  }>;
}

import { FulfillmentTypeValue } from '@/src/features/picker/constants/order.constants';

export type OrderStatus = "new" | "partial" | "completed";

export interface BatchRow {
  id: string;
  batchNo: string;
  quantity: string;
}

export interface OrderItem {
  id: string;
  medicineId?: string;
  name: string;
  manufacturer?: string;
  batchNo?: string;
  expiryDate?: string;
  requiredQty: number;
  pickedQty: number;
  description?: string;
  status: "pending" | "partial" | "completed" | "picked" | "packed";
  image?: string;
  fulfillmentType?: FulfillmentTypeValue;
}

export interface Order {
  id: string; // Internal API ID (GUID)
  orderId?: string; // Human readable ID (CS_ORD...)
  customerName?: string;
  orderDate?: string;
  items?: string[];
  extraItems?: number;
  timeAgo?: string;
  status: OrderStatus;
  images?: string[];
  // Fields for partial orders
  date?: string;
  outOfStockMeds?: string[];
  pickedCount?: number;
  totalCount?: number;
  stockStatus?: "available" | "waiting";
  // Fields for completed orders
  medicineSlug?: string;
  completionDate?: string;
  deliveryDate?: string;
  totalItems?: number;
  // Field for full picking list
  pickingItems?: OrderItem[];
  pickedBy?: string;
}

export interface ApiOrderItem {
  id: string;
  medicineId?: string;
  medicineSnapshot: {
    name: string;
    slug: string;
    thumbnailUrl?: string;
    requiresPrescription: boolean;
  };
  quantity: number;
  status: string;
  batchNumber?: string;
  expiryDate?: string;
  fulfillmentType?: FulfillmentTypeValue;
}

export interface ApiOrder {
  id: string;
  orderId: string;
  customerId: string;
  status: number;
  paymentStatus: string;
  deliveryType: string;
  deliveryAddress: {
    city: string;
    line1: string;
    line2?: string;
    state: string;
    country: string;
    pincode: string;
    landmark?: string;
  };
  total: string;
  createdAt: string;
  updatedAt?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: ApiOrderItem[];
}

export interface ApiPickerQueueResponse {
  success: boolean;
  data: ApiOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: number;
  search?: string;
}

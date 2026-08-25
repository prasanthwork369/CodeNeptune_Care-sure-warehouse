import React from "react";
import OrderSuccessView from "@/src/components/common/OrderSuccessView";

export const DispatchSuccessLayout = () => (
  <OrderSuccessView
    title="Order is ready for delivery"
    backLabel="Back to Dispatcher"
    backRoute="/(tabs)/dispatcher"
    dateLabel="Dispatched on"
  />
);

export default DispatchSuccessLayout;

import React from "react";
import OrderSuccessView from "@/src/components/common/OrderSuccessView";

export const PackingSuccessLayout = () => (
  <OrderSuccessView
    title="Order sent to dispatch"
    subtitle="All items verified and packed"
    backLabel="Back to Checker"
    backRoute="/(tabs)/checker"
  />
);

export default PackingSuccessLayout;

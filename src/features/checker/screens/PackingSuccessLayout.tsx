import React from "react";
import OrderSuccessView from "@/src/components/common/OrderSuccessView";

export const PackingSuccessLayout = () => (
  <OrderSuccessView
    title="Order sent to Packer"
    subtitle="All items verified and checked "
    backLabel="Back to Checker"
    backRoute="/(tabs)/checker"
  />
);

export default PackingSuccessLayout;

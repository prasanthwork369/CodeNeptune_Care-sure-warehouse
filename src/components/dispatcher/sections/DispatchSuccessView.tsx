import React from "react";
import OrderSuccessView from "../../common/OrderSuccessView";

const DispatchSuccessView = () => (
  <OrderSuccessView
    title="Order is ready for delivery"
    backLabel="Back to Dispatcher"
    backRoute="/(tabs)/dispatcher"
    dateLabel="Dispatched on"
  />
);

export default DispatchSuccessView;

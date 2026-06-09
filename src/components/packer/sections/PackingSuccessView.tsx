import React from 'react';
import OrderSuccessView from '../../common/OrderSuccessView';

const PackingSuccessView = () => (
    <OrderSuccessView
        title="Order sent to dispatch"
        subtitle="All items verified and packed"
        backLabel="Back to Packer"
        backRoute="/(tabs)/packer"
    />
);

export default PackingSuccessView;

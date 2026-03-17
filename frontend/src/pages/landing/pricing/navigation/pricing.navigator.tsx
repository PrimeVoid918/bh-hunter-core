import React from 'react';
import PricingLayout from './pricing.layout';
import PricingPage from '../pricing.page';
import CheckoutPage from '../checkout/checkout.page';
import CancelPage from '../result/cancel.page';
import SuccessPage from '../result/success.page';

export default function PricingNavigator() {
  return {
    path: 'pricing',
    element: <PricingLayout />,
    children: [
      { index: true, element: <PricingPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'success', element: <SuccessPage /> },
      { path: 'cancel', element: <CancelPage /> },
    ],
  };
}

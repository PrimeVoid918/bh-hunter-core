import React from 'react';
import AccountsLayout from './accounts.layout';
import AccountsPage from '../account.page';
import BillingPage from '../billing/billing.page';

export default function AccountsNavigator() {
  return {
    path: 'accounts',
    element: <AccountsLayout />,
    children: [
      { index: true, element: <AccountsPage /> },
      { path: 'billing', element: <BillingPage /> },
    ],
  };
}

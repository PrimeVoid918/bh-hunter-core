import TenantsLayout from './tenants.layout';
import TenantTableMainScreen from '../screens/tenant-table.main.screen';

export default function TenantsUsersNavigator() {
  return {
    path: 'tenants', //* route
    element: <TenantsLayout />,
    children: [
      //* registering navigators
      { index: true, element: <TenantTableMainScreen /> }, //* default screen
      // { path: ':id', element: <TenantsInfoScreen /> },
    ],
  };
}

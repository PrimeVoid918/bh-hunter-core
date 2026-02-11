import TenantsInfoScreen from '../screens/tenants.info.screen';
import TenantsValidationMainScreen from '../screens/tenants.validation.main.screen';
import TenantsLayout from './tenants.layout';

export default function TenantsValidationNavigator() {
  return {
    path: 'tenants', //* route
    element: <TenantsLayout />,
    children: [
      //* registering navigators
      { index: true, element: <TenantsValidationMainScreen /> }, //* default screen
      { path: ':id', element: <TenantsInfoScreen /> },
    ],
  };
}

import ValidationLayout from './validation.layout';
import OwnersValidationNavigator from '../screens/owners/navigation/owners.navigator';
import TenantsValidationNavigator from '../screens/tenants/navigation/tenants.navigator';

export default function ValidationNavigator() {
  return {
    path: 'validation', //* route
    element: <ValidationLayout />,
    children: [
      //* registering navigators
      { ...OwnersValidationNavigator() },
      { ...TenantsValidationNavigator() },
    ],
  };
}

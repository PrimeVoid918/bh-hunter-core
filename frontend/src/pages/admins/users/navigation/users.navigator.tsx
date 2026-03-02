import OwnersUsersNavigator from '../screens/owners/navigation/owners.navigator';
import TenantsUsersNavigator from '../screens/tenants/navigation/tenants.navigator';
import UsersLayout from './users.layout';

export default function UsersNavigator() {
  return {
    path: 'users', //* route
    element: <UsersLayout />,
    children: [
      //* registering navigators
      { ...OwnersUsersNavigator() },
      { ...TenantsUsersNavigator() },
    ],
  };
}

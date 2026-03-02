import DashboardNavigator from '../dashboard/navigation/dashboard.navigator';
import LogsNavigator from '../logs/navigation/logs.navigator';
import UsersNavigator from '../users/navigation/users.navigator';
import ValidationNavigator from '../validation/navigation/validation.navigator';
import AdminsSidebarLayout from './admins.sidebar-layout';

export default function AdminNavigator() {
  return {
    path: 'admin', //* route
    element: <AdminsSidebarLayout />,
    children: [
      //* registering navigators
      { ...DashboardNavigator() }, //* default screen
      { ...ValidationNavigator() },
      { ...UsersNavigator() },
      { ...LogsNavigator() },
    ],
  };
}

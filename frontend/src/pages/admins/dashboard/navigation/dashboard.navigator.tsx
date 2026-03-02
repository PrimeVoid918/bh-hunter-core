import DashboardMainScreen from '../screens/dashboard.main.screen';
import DashboardLayout from './dashboard.layout';

export default function DashboardNavigator() {
  return {
    // path: 'dashboard', //* route
    path: '', //* route
    element: <DashboardLayout />,
    children: [
      //* registering navigators
      { index: true, element: <DashboardMainScreen /> }, //* default screen
    ],
  };
}

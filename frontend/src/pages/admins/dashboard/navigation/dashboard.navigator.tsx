import DashboardMainScreen from '../screens/dashboard.main.screen';
import FinancialMainScreen from '../screens/financial/financial.main.screen';
import InsightsMainScreen from '../screens/insights/insights.main.screen';
import OperationsMainScreen from '../screens/operations/operations.main.screen';
import DashboardLayout from './dashboard.layout';

export default function DashboardNavigator() {
  return {
    path: '',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardMainScreen /> },
      { path: 'dashboard/financial', element: <FinancialMainScreen /> },
      { path: 'dashboard/operations', element: <OperationsMainScreen /> },
      { path: 'dashboard/insights', element: <InsightsMainScreen /> },
    ],
  };
}

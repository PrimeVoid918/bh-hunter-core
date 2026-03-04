import LogsMainScreen from '../screens/logs.main.screen';
import LogsLayout from './logs.layout';

export default function LogsNavigator() {
  return {
    path: 'logs', //* route
    element: <LogsLayout />,
    children: [
      //* registering navigators
      { index: true, element: <LogsMainScreen /> }, //* default screen
    ],
  };
}

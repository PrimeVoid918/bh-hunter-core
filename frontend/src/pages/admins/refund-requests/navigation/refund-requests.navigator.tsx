import RefundRequestsMainScreen from '../screens/refund-requests.main.screen';
import RefundRequestsLayout from './refund-requests.layout';

export default function RefundRequestsNavigator() {
  return {
    path: 'request-refund', //* route
    element: <RefundRequestsLayout />,
    children: [
      //* registering navigators
      { index: true, element: <RefundRequestsMainScreen /> }, //* default screen
    ],
  };
}

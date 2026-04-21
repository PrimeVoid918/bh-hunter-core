import TransactionMainScreen from '../screens/transaction.main.screen';
import TransactionsLayout from './transactions.layout';

export default function TransactionsNavigator() {
  return {
    path: 'transactions', //* route
    element: <TransactionsLayout />,
    children: [
      //* registering navigators
      { index: true, element: <TransactionMainScreen /> }, //* default screen
    ],
  };
}

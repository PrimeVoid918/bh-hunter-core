import OwnersInfoScreen from '../screens/owners.info.screen';
import OwnersMainScreen from '../screens/main.screen/owners.main.screen';
import OwnersLayout from './owners.layout';

export default function OwnersUsersNavigator() {
  return {
    path: 'owners', //* route
    element: <OwnersLayout />,
    children: [
      //* registering navigators
      { index: true, element: <OwnersMainScreen /> }, //* default screen
      { path: ':id/permits', element: <OwnersInfoScreen /> },
    ],
  };
}

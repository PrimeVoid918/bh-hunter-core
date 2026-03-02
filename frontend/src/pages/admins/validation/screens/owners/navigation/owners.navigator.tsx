import OwnersInfoScreen from '../screens/owners.info.screen';
import OwnersValidationMainScreen from '../screens/main.screen/owners.validation.main.screen';
import OwnersLayout from './owners.layout';

export default function OwnersValidationNavigator() {
  return {
    path: 'owners', //* route
    element: <OwnersLayout />,
    children: [
      //* registering navigators
      { index: true, element: <OwnersValidationMainScreen /> }, //* default screen
      { path: ':id/permits', element: <OwnersInfoScreen /> },
    ],
  };
}

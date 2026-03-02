import { createBrowserRouter, Outlet } from 'react-router-dom';
import { PrivateRouteGuard } from '@/infrastructure/guards/route-guards/private-routes.guard';
import AdminNavigator from '@/pages/admins/navigation/admins.navigator';
import AuthNavigator from '@/pages/auth/navigation/auth.navigator';
import Error404Page from '@/pages/shared/screens/Error-404.page';
import LandingNavigator from '@/pages/landing/navigations/landing.navigator';

export default function RootNavigator() {
  const adminNav = AdminNavigator();
  return createBrowserRouter([
    {
      element: <RootLayout />, //* screen
      children: [
        { ...LandingNavigator() }, //* default screen
        { ...AuthNavigator() },
        {
          ...adminNav,
          element: (
            <PrivateRouteGuard bypass={false}>
              {adminNav.element}
            </PrivateRouteGuard>
          ),
        },
        { path: '*', element: <Error404Page /> },
      ],
    },
  ]);
}

function RootLayout() {
  return <Outlet />;
}

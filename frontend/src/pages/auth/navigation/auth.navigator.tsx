import LoginScreen from '../login/login.screen';
import SignupScreen from '../signup/signup.screen';
import AuthLayout from './auth.layout';

export default function AuthNavigator() {
  return {
    path: 'auth',
    element: <AuthLayout />, // wraps all auth screens
    children: [
      { path: 'login', element: <LoginScreen /> },
      { path: 'signup', element: <SignupScreen /> },
    ],
  };
}

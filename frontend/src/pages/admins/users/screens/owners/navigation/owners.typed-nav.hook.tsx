import { useNavigate } from 'react-router-dom';
import type { OwnerValidationRoutes } from './types';

export function useTypedOwnerValidationNavigation() {
  const navigate = useNavigate();

  return function navigateTo<T extends keyof OwnerValidationRoutes>(
    route: T,
    params?: OwnerValidationRoutes[T],
  ) {
    let path: string = route as string; // <-- cast to string

    // Replace params if any (for dynamic routes)
    if (params) {
      Object.keys(params).forEach((key) => {
        path = path.replace(`:${key}`, (params as any)[key]);
      });
    }

    navigate(path);
  };
}

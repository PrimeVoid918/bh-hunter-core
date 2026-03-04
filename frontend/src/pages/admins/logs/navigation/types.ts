export type AdminRoutes = {
  '/admin': undefined;
  '/admin/logs': undefined;
  '/admin/info': undefined;
  '/admin/validation/owners/permit': { ownerId: string };
  '/admin/validation/users/permit': { userId: string };
};

//* usage
/*
import { useParams } from 'react-router-dom';
import type { AdminRoutes } from '@/types/routes';

function OwnersPermit() {
  const params = useParams<keyof AdminRoutes>();
  // now TypeScript knows the shape of params
}
*/

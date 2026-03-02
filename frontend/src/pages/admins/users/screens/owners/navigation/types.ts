export type OwnerValidationRoutes = {
  '/admin/users/owners': undefined;
  '/admin/users/owners/:id/permit': { permitId: string };
  '/admin/users/owners/:id/owner': { ownerId: string };
  // '/admin/validation/owners/permit': { userId: string };
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

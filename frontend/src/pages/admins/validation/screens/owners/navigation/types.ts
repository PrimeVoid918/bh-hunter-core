export type OwnerValidationRoutes = {
  '/admin/validation/owners': undefined;
  '/admin/validation/owners/:id/permit': { permitId: string };
  '/admin/validation/owners/:id/owner': { ownerId: string };
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

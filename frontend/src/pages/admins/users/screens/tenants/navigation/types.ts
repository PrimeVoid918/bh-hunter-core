export type TenantValidationRoutes = {
  '/admin/users/tenants': undefined;
  '/admin/users/tenants/:id/permit': { permitId: string };
  '/admin/users/tenants/:id/owner': { tenantsId: string };
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

export type TenantValidationRoutes = {
  '/admin/validation/tenants': undefined;
  '/admin/validation/tenants/:id/permit': { permitId: string };
  '/admin/validation/tenants/:id/owner': { tenantsId: string };
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

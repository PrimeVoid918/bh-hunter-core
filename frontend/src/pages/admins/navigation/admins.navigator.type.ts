export type AdminRoutes = {
  '/admin': undefined;
  '/admin/validation/owners/permit': { ownerId: string };
  '/admin/validation/users/permit': { tenantId: string };
  '/admin/users/owners/permit': { ownerId: string };
  '/admin/users/users/permit': { tenantId: string };
  '/admin/logs': undefined;
};
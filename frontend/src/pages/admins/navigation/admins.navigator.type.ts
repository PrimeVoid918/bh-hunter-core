export type AdminRoutes = {
  '/admin': undefined;
  '/admin/dashboard/financial': undefined;
  '/admin/dashboard/operations': undefined;
  '/admin/dashboard/owners': undefined;
  '/admin/dashboard/tenants': undefined;
  '/admin/dashboard/quality': undefined;
  '/admin/transactions': undefined;
  '/admin/request-refund': undefined;
  '/admin/validation/owners/permit': { ownerId: string };
  '/admin/validation/users/permit': { tenantId: string };
  '/admin/users/owners/permit': { ownerId: string };
  '/admin/users/users/permit': { tenantId: string };
  '/admin/logs': undefined;
};

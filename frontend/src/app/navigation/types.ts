export interface RootRoutesInterface {
  '/': undefined;
  '/auth/login': undefined;
  '/auth/signup': undefined;
  '/admin': undefined;
  '*': undefined;

  '/download': undefined;
  '/docs': undefined;
  '/subscription': undefined;
}

export interface AdminRoutes {
  '/admin/users/:id': { id: string };
}

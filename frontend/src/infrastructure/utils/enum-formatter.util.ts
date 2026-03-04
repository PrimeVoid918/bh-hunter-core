export const formatUserRole = (role?: string): string => {
  const roles: Record<string, string> = {
    TENANT: 'Tenant',
    OWNER: 'Property Owner',
    ADMIN: 'Administrator',
    GUEST: 'Guest User',
  };
  return roles[role || ''] || 'User';
};

export const formatRegistrationStatus = (status?: string): string => {
  const statuses: Record<string, string> = {
    PENDING: 'Review in Progress',
    COMPLETED: 'Registration Finished',
  };
  return statuses[status || ''] || 'Unknown Status';
};

export const formatVerificationLevel = (level?: string): string => {
  const levels: Record<string, string> = {
    UNVERIFIED: 'Action Required',
    PROFILE_ONLY: 'Basic Profile Linked',
    FULLY_VERIFIED: 'Identity Verified',
  };
  return levels[level || ''] || 'Pending Verification';
};

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

// Add this to @/infrastructure/utils/enum-formatter.util
export const formatEnum = (value?: string): string => {
  if (!value) return 'Unknown';
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// You might also want a status formatter for APPROVED/PENDING
export const formatStatus = (status?: string): string => {
  const statuses: Record<string, string> = {
    APPROVED: 'Approved',
    PENDING: 'Under Review',
    REJECTED: 'Needs Re-upload',
  };
  return statuses[status || ''] || status || 'Pending';
};

import { useMemo } from 'react';
import { useAuthStore } from '.';
import { decodeJWT } from '@/lib/utils/decode-jwt-utils';

type UseIsProtectedOptions = {
  roles?: string[];
  permissions?: string[];
  opt?: 'all' | 'any';
};

const ADMIN_ROLE_ALIASES = new Set([
  'admin',
  'administrator',
  'cloudadmin',
  'cloudadministrator',
  'superadmin',
]);

const roleToString = (role: unknown): string => {
  if (typeof role === 'string') return role;
  if (!role || typeof role !== 'object') return '';

  const record = role as Record<string, unknown>;
  const getCaseInsensitive = (key: string) => {
    const matchedKey = Object.keys(record).find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase()
    );
    return matchedKey ? record[matchedKey] : undefined;
  };

  return String(
    getCaseInsensitive('slug') ||
      getCaseInsensitive('name') ||
      getCaseInsensitive('role') ||
      getCaseInsensitive('roleName') ||
      getCaseInsensitive('roleSlug') ||
      getCaseInsensitive('value') ||
      ''
  );
};

const normalizeRole = (role: unknown): string =>
  roleToString(role)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const rolesMatch = (userRole: unknown, requiredRole: string): boolean => {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedRequiredRole = normalizeRole(requiredRole);

  if (normalizedRequiredRole === 'admin') {
    return ADMIN_ROLE_ALIASES.has(normalizedUserRole);
  }

  return normalizedUserRole === normalizedRequiredRole;
};

const getCurrentOrgRoles = (
  user: any,
  accessToken: string | null,
  selectedOrgId: string | null
): unknown[] => {
  const rootRoles = user?.roles ?? [];

  if (!user?.memberships?.length || !accessToken) return rootRoles;

  const decoded = decodeJWT(accessToken);
  const currentOrgId = selectedOrgId ?? decoded?.org_id;
  const allMembershipRoles = user.memberships.flatMap((membership: any) => membership.roles ?? []);

  if (!currentOrgId) return [...rootRoles, ...allMembershipRoles];

  const membership = user.memberships.find((m: any) => m.organizationId === currentOrgId);
  return [...rootRoles, ...(membership?.roles ?? allMembershipRoles)];
};

const checkAllRoles = (userRoles: unknown[] | undefined, requiredRoles: string[]): boolean => {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.every((role) =>
    userRoles?.some((userRole) => rolesMatch(userRole, role))
  );
};

const checkAllPermissions = (
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean => {
  if (requiredPermissions.length === 0) return true;
  return requiredPermissions.every((permission) => userPermissions?.includes(permission));
};

const checkAnyRole = (userRoles: unknown[] | undefined, requiredRoles: string[]): boolean => {
  if (requiredRoles.length === 0) return false;
  return requiredRoles.some((role) =>
    userRoles?.some((userRole) => rolesMatch(userRole, role))
  );
};

const checkAnyPermission = (
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean => {
  if (requiredPermissions.length === 0) return false;
  return requiredPermissions.some((permission) => userPermissions?.includes(permission));
};

export const useIsProtected = ({
  roles = [],
  permissions = [],
  opt = 'any',
}: UseIsProtectedOptions = {}) => {
  const { user, isAuthenticated, accessToken, selectedOrgId } = useAuthStore();

  const isProtected = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    if (roles.length === 0 && permissions.length === 0) return false;

    const userRoles = getCurrentOrgRoles(user, accessToken, selectedOrgId);

    if (opt === 'all') {
      const hasAllRoles = checkAllRoles(userRoles, roles);
      const hasAllPermissions = checkAllPermissions(user.permissions, permissions);
      return hasAllRoles && hasAllPermissions;
    }

    const hasAnyRole = checkAnyRole(userRoles, roles);
    const hasAnyPermission = checkAnyPermission(user.permissions, permissions);
    return hasAnyRole || hasAnyPermission;
  }, [isAuthenticated, user, accessToken, selectedOrgId, roles, permissions, opt]);

  return {
    isProtected,
    isAuthenticated,
    user,
  };
};

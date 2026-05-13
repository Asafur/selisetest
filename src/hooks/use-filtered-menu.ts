/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';
import { MenuItem } from '../models/sidebar';
import { useAuthStore } from '@/state/store/auth';
import { decodeJWT } from '@/lib/utils/decode-jwt-utils';

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
  const matchedKey = Object.keys(record).find((candidate) =>
    ['slug', 'name', 'role', 'rolename', 'roleslug', 'value'].includes(candidate.toLowerCase())
  );

  return matchedKey ? String(record[matchedKey]) : '';
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

export const useFilteredMenu = (menuItems: MenuItem[]): MenuItem[] => {
  const { accessToken, selectedOrgId, user } = useAuthStore();

  const filterMenuItem = (item: MenuItem): MenuItem | null => {
    const userRoles = getCurrentOrgRoles(user, accessToken, selectedOrgId);
    const canShowByRole =
      !item.roles?.length ||
      item.roles.some((role) => userRoles.some((userRole) => rolesMatch(userRole, role)));

    if (!canShowByRole) return null;

    const filteredChildren = item.children
      ? (item.children.map(filterMenuItem).filter(Boolean) as MenuItem[])
      : undefined;

    return {
      ...item,
      children: filteredChildren,
    };
  };

  return useMemo(
    () => menuItems.map(filterMenuItem).filter(Boolean) as MenuItem[],
    [menuItems, user, accessToken, selectedOrgId]
  );
};

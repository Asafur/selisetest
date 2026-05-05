import { useAuthStore } from '@/state/store/auth';
import { CurrentBuilderUser } from '../types';

export const useBuilderUser = (): CurrentBuilderUser | null => {
  const user = useAuthStore((state) => state.user);
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);

  if (!user?.itemId) return null;

  return {
    userId: user.itemId,
    workspaceId: selectedOrgId || user.memberships?.[0]?.organizationId,
    email: user.email,
  };
};

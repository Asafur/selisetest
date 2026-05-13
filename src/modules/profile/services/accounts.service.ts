import { clients } from '@/lib/https';
import { getSeliseProjectKey } from '@/lib/selise-config';
import { ChangePasswordPayload } from '../types/account.type';
import { User } from '@/types/user.type';
import { CreateUserFormType, ProfileFormType } from '../components/utils/index.utils';

export const changePassword = async (payload: ChangePasswordPayload) => {
  payload.projectKey = payload.projectKey ?? getSeliseProjectKey();
  return clients.post('/idp/v1/Iam/ChangePassword', JSON.stringify(payload));
};

export const getAccount = async (): Promise<User> => {
  const res = await clients.get<{ data: User }>('/idp/v1/Iam/GetAccount');
  return res.data;
};

export const updateAccount = (data: ProfileFormType) => {
  return clients.post<User>('/idp/v1/Iam/UpdateAccount', JSON.stringify(data));
};

export const createAccount = (data: CreateUserFormType) => {
  return clients.post<{
    itemId: string;
    errors: unknown;
    isSuccess: boolean;
  }>('/idp/v1/Iam/Create', JSON.stringify(data));
};

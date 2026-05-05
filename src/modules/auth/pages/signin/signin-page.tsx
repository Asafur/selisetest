import { Signin } from '@/modules/auth/components/signin';
import { getLocalhostRedirectUrl, LocalhostRedirect } from '@/modules/auth/utils/local-dev-origin';

export const SigninPage = () => {
  const localhostRedirectUrl = getLocalhostRedirectUrl();

  if (localhostRedirectUrl) {
    return <LocalhostRedirect to={localhostRedirectUrl} />;
  }

  return <Signin />;
};

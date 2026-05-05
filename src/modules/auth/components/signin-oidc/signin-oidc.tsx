import { Button } from '@/components/ui-kit/button';
import seliseSmallLogo from '@/assets/images/selise_logo_small.svg';
import { getSeliseApiBaseUrl, getSeliseProjectKey } from '@/lib/selise-config';

const blocksOIdCClientId = import.meta.env.VITE_BLOCKS_OIDC_CLIENT_ID;
const oidcRedirectUri = import.meta.env.VITE_BLOCKS_OIDC_REDIRECT_URI;

export const SigninOidc = () => {
  const oidcClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const oidcUrl = `${getSeliseApiBaseUrl()}/idp/v1/Authentication/authorize?X-Blocks-Key=${getSeliseProjectKey()}&client_id=${blocksOIdCClientId}&redirect_uri=${oidcRedirectUri}&response_type=code&scope=openid`;
    window.location.href = oidcUrl;
  };

  if (!blocksOIdCClientId || !oidcRedirectUri) return null;

  return (
    <Button className="w-full h-12 font-bold" variant={'outline'} onClick={oidcClickHandler}>
      <img src={seliseSmallLogo} width={25} height={25} alt="Blocks logo" className="mr-2" /> Log in
      with Blocks
    </Button>
  );
};

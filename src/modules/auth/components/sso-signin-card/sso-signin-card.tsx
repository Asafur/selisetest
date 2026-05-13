import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { SocialAuthProvider } from '@/constant/sso';
import { SSOservice, SSOLoginResponse } from '../../services/sso.service';
import { Button } from '@/components/ui-kit/button';
import {
  getSsoProviderRedirectUrl,
  rememberSsoLoginState,
} from '@/modules/auth/utils/sso-state';

type SSOSigninCardProps = {
  providerConfig: SocialAuthProvider & {
    audience: string;
    provider: string;
    isAvailable: boolean;
  };
  showText?: boolean;
  totalProviders?: number;
};

const SSOSigninCard = ({
  providerConfig,
  showText = false,
  totalProviders = 1,
}: Readonly<SSOSigninCardProps>) => {
  const ssoService = new SSOservice();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const getButtonWidth = () => {
    if (showText) return 'w-full';

    switch (totalProviders) {
      case 2:
        return 'w-1/2';
      case 3:
        return 'w-1/3';
      case 4:
        return 'w-1/4';
      case 5:
        return 'w-1/5';
      default:
        return 'w-full';
    }
  };

  const onClickHandler = async (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();

      if (isRedirecting) {
        return;
      }

      if (!providerConfig.isAvailable) {
        return;
      }

      if (!providerConfig?.audience || !providerConfig?.provider) {
        const errorMsg = 'Provider configuration is incomplete';
        console.error('[SSO Button] Configuration error:', errorMsg, {
          audience: providerConfig?.audience,
          provider: providerConfig?.provider,
          fullConfig: providerConfig,
        });
        alert('Provider configuration is incomplete. Please check the setup.');
        return;
      }

      const isLocalDev =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const useLocalSsoCallback =
        isLocalDev && import.meta.env.VITE_ENABLE_LOCAL_SSO_CALLBACK === 'true';
      const localCallbackUrl = `${window.location.origin}/sso/${providerConfig.provider}/callback`;
      const requestPayload = {
        provider: providerConfig.provider,
        audience: useLocalSsoCallback ? window.location.origin : providerConfig.audience,
        ...(useLocalSsoCallback ? { nextUrl: localCallbackUrl } : {}),
        sendAsResponse: true,
      };

      setIsRedirecting(true);
      const res: SSOLoginResponse = await ssoService.getSocialLoginEndpoint(requestPayload);

      if (res.error) {
        console.error('[SSO Button] Authentication error:', res.error);
        setIsRedirecting(false);
        return alert(`Authentication error: ${res.error}`);
      }

      // Handle MFA required case
      if (res.requiresMfa && res.mfaToken && res.mfaType !== undefined) {
        const redirectUrl = `/verify-mfa?mfa_id=${res.mfaToken}&mfa_type=${res.mfaType}&user_name=${encodeURIComponent(res.email ?? '')}&sso=true`;
        navigate(redirectUrl);
        return;
      }

      // Regular SSO flow
      if (!res.providerUrl) {
        setIsRedirecting(false);
        return alert('No redirect URL received from the authentication service.');
      }

      rememberSsoLoginState(providerConfig.provider, res.providerUrl);
      window.location.href = getSsoProviderRedirectUrl(providerConfig.provider, res.providerUrl);
    } catch (error) {
      setIsRedirecting(false);
      console.error('[SSO Button] === UNEXPECTED ERROR ===');
      console.error('[SSO Button] Error details:', error);
      console.error(
        '[SSO Button] Error stack:',
        error instanceof Error ? error.stack : 'No stack trace'
      );
      console.error(
        '[SSO Button] Error message:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const buttonContent = (
    <Button
      variant="outline"
      className={`${getButtonWidth()} h-12`}
      onClick={onClickHandler}
      disabled={isRedirecting}
      aria-busy={isRedirecting}
    >
      <img
        src={providerConfig.imageSrc}
        width={20}
        height={20}
        alt={`${providerConfig.label} logo`}
        className={`${showText ? 'mr-2 font-bold' : ''}`}
      />
      {showText && `Log in with ${providerConfig.label}`}
    </Button>
  );

  return buttonContent;
};

export default SSOSigninCard;

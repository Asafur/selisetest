import { useTranslation } from 'react-i18next';
import { GRANT_TYPES } from '@/constant/auth';
import { Divider } from '@/components/core';
import { SsoSignin } from '../signin-sso';
import { SigninEmail } from '../signin-email';
import { Link, useLocation } from 'react-router-dom';
import { useGetLoginOptions, useGetSignupSettings } from '../../hooks/use-auth';

export const Signin = () => {
  const { data: loginOption } = useGetLoginOptions();
  const { data: signupSettings } = useGetSignupSettings();

  const { t } = useTranslation();
  const location = useLocation();
  const ssoError = location.state?.ssoError;

  const passwordGrantAllowed = !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.password);
  const socialGrantAllowed =
    !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.social) &&
    !!loginOption?.ssoInfo?.length;
  const oidcGrantAllowed = !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.oidc);

  const isDivider = passwordGrantAllowed && (socialGrantAllowed || oidcGrantAllowed);

  const isBannerAllowedToVisible = [
    'localhost',
    'construct.seliseblocks.com',
    'stg-construct.seliseblocks.com',
    'dev-construct.seliseblocks.com',
  ].some((domain) => window.location.hostname === domain);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-200">
          Welcome back
        </div>
        <div className="text-2xl font-bold text-high-emphasis">Log in to VibeBuilder</div>
        {(signupSettings?.isEmailPasswordSignUpEnabled || signupSettings?.isSSoSignUpEnabled) && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm font-normal text-medium-emphasis">
              {t('DONT_HAVE_ACCOUNT')}
            </span>
            <Link
              to={'/signup'}
              className="text-sm font-bold text-primary hover:text-primary-600 hover:underline"
            >
              {t('SIGN_UP')}
            </Link>
          </div>
        )}
      </div>
      
      {ssoError && (
        <div className="w-full">
          <div className="rounded-lg bg-error-background border border-error p-4">
            <p className="text-xs font-normal text-error-high-emphasis">
              {ssoError}
            </p>
          </div>
        </div>
      )}

      <div className={'w-full ' + (isBannerAllowedToVisible ? 'visible' : 'invisible h-0')}>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-normal text-slate-300">
            Secure identity, structured content, media storage, and publishing in one SELISE-backed workspace.
          </p>
        </div>
      </div>
      <div className="w-full flex flex-col gap-6">
        {passwordGrantAllowed && <SigninEmail />}
        {isDivider && <Divider text={t('AUTH_OR')} />}
        {socialGrantAllowed && loginOption && <SsoSignin loginOption={loginOption} />}
      </div>
    </div>
  );
};

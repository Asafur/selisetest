import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/state/store/auth';
import { useSigninMutation } from '@/modules/auth/hooks/use-auth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  clearRedirectAfterLogin,
  getRedirectAfterLogin,
} from '@/modules/auth/utils/redirect-after-login';
import {
  clearSsoCallbackExchange,
  clearSsoLoginState,
  clearSsoStateRecovery,
  startSsoCallbackExchange,
  wasExpectedSsoState,
} from '@/modules/auth/utils/sso-state';

const NO_SUCH_EMAIL_FALLBACK =
  'No account exists for this email. Ask an admin to invite the user or enable SSO sign-up in SELISE Identity.';
const SSO_CALLBACK_FAILED_FALLBACK =
  'SSO sign-in could not be completed. Please start Google sign-in again.';
const SSO_STATE_EXPIRED_FALLBACK =
  'Your SSO sign-in session expired. Please start Google sign-in again.';
const SSO_STATE_REJECTED_FALLBACK =
  'SELISE Identity rejected this Google sign-in state even after a fresh retry. Check the Google SSO credential in SELISE Identity, then start Google sign-in again.';
const SSO_NETWORK_FAILED_FALLBACK =
  'The browser could not reach SELISE Identity. Check your connection or browser shields, then start Google sign-in again.';

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));

const stringifyError = (error: any): string =>
  `${error?.message || ''} ${JSON.stringify(error?.error || {})} ${JSON.stringify(
    error || {}
  )}`.toLowerCase();

const getBackendErrorMessage = (error: any): string | null => {
  const backendError = error?.error;

  return (
    backendError?.error_description ||
    backendError?.message ||
    error?.error_description ||
    error?.message ||
    null
  );
};

const isNoSuchEmailError = (errorPayloadStr: string): boolean =>
  [
    'no account',
    'no such email',
    'email_not_found',
    'user_not_found',
    'user does not exist',
    'account does not exist',
    'sso signup is disabled',
    'sso sign-up is disabled',
  ].some((marker) => errorPayloadStr.includes(marker));

const isNetworkFetchError = (errorPayloadStr: string): boolean =>
  errorPayloadStr.includes('failed to fetch') || errorPayloadStr.includes('networkerror');

function getSsoActivationPath(url: string, provider?: string): string | null {
  const queryPart = url.split('?')[1];
  if (!queryPart) return null;

  const params = new URLSearchParams(queryPart);
  const username = params.get('username');
  const ssoCode = params.get('code');

  return username && ssoCode
    ? `/sso-signup?email=${username}&code=${ssoCode}&provider=${provider}`
    : null;
}

/**
 * Reads `code` and `state` from the URL search params and exchanges them
 * for a session token. Handles deduplication (Apple POST → 302 → GET),
 * MFA redirects, and error feedback.
 */
export function useSsoActivation(provider?: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { login, logout: setUnAuthenticated, setTokens } = useAuthStore();
  const { mutateAsync, isPending } = useSigninMutation<'social'>({ suppressToast: true });

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const effectRan = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    if (!code || !state) {
      navigate('/login', { replace: true });
      return;
    }

    if (effectRan.current) {
      navigate('/login', { replace: true });
      return;
    }

    effectRan.current = true;

    async function activate() {
      try {
        const exchangeStarted = startSsoCallbackExchange(provider, state as string);

        if (!exchangeStarted) {
          return;
        }

        const payload = {
          grantType: 'social' as const,
          code: code as string,
          state: state as string,
        };
        const res = await mutateAsync(payload).catch(async (error) => {
          if (!isNetworkFetchError(stringifyError(error))) {
            throw error;
          }

          await wait(600);
          return mutateAsync(payload);
        });

        // mutateAsync<'social'> returns SignInResponse | MFASigninResponse
        // But for social login, it typically returns SignInResponse
        if ('access_token' in res && res.access_token) {
          clearSsoCallbackExchange();
          clearSsoLoginState();
          clearSsoStateRecovery();
          login(res.access_token, res.refresh_token ?? '');
          setTokens({ accessToken: res.access_token, refreshToken: res.refresh_token ?? '' });
          const redirectAfterLogin = getRedirectAfterLogin(undefined, '/dashboard');
          clearRedirectAfterLogin();
          return navigate(redirectAfterLogin, { replace: true });
        }

        const activationPath =
          'sso_user_redirect_url' in res && res.sso_user_redirect_url
            ? getSsoActivationPath(res.sso_user_redirect_url, provider)
            : null;

        if (activationPath) {
          clearSsoCallbackExchange();
          clearSsoLoginState();
          clearSsoStateRecovery();
          return navigate(activationPath, { replace: true });
        }
        if ('enable_mfa' in res && res.enable_mfa) {
          clearSsoCallbackExchange();
          clearSsoLoginState();
          clearSsoStateRecovery();
          return navigate(`/verify-mfa?mfa_id=${res.mfaId}&mfa_type=${res.mfaType}`);
        }
        clearSsoCallbackExchange();
        navigate('/login', { replace: true });
      } catch (error: any) {
        console.error('SSO Callback error:', error);
        setUnAuthenticated();
        clearSsoCallbackExchange();

        const errorPayloadStr = stringifyError(error);
        const backendMessage = getBackendErrorMessage(error);

        if (errorPayloadStr.includes('state_data_not_found')) {
          const stateWasExpected = wasExpectedSsoState(provider, state as string);
          navigate('/login', {
            replace: true,
            state: {
              ssoError: stateWasExpected
                ? t('SSO_STATE_REJECTED', {
                    defaultValue: SSO_STATE_REJECTED_FALLBACK,
                  })
                : t('SSO_STATE_EXPIRED', {
                    defaultValue: SSO_STATE_EXPIRED_FALLBACK,
                  }),
            },
          });
        } else if (isNoSuchEmailError(errorPayloadStr)) {
          const emailTarget = error?.error?.error_description?.split(' ')[0];
          const noSuchEmailTemplate = t('NO_SUCH_EMAIL_MESSAGE', {
            defaultValue: NO_SUCH_EMAIL_FALLBACK,
          });
          const errorMsg = emailTarget
            ? noSuchEmailTemplate.replace('---', ` (${emailTarget})`)
            : noSuchEmailTemplate.replace('---', ``);
          navigate('/login', { replace: true, state: { ssoError: errorMsg } });
        } else if (isNetworkFetchError(errorPayloadStr)) {
          navigate('/login', {
            replace: true,
            state: {
              ssoError: t('SSO_NETWORK_FAILED', {
                defaultValue: SSO_NETWORK_FAILED_FALLBACK,
              }),
            },
          });
        } else {
          navigate('/login', {
            replace: true,
            state: {
              ssoError:
                backendMessage ||
                t('SSO_CALLBACK_FAILED', {
                  defaultValue: SSO_CALLBACK_FAILED_FALLBACK,
                }),
            },
          });
        }
      }
    }

    activate();
  }, [
    code,
    enabled,
    state,
    mutateAsync,
    navigate,
    login,
    setUnAuthenticated,
    provider,
    setTokens,
    t,
  ]);

  return { isPending };
}

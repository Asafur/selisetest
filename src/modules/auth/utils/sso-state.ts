const SSO_LOGIN_STATE_KEY = 'selise:sso-login-state';
const SSO_RECOVERY_KEY = 'selise:sso-state-recovery';

type StoredSsoState = {
  provider: string;
  state: string;
  createdAt: number;
};

type RecoveryState = StoredSsoState & {
  attemptCount: number;
};

const isBrowser = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const normalizeProvider = (provider?: string | null) => provider?.trim().toLowerCase() ?? '';

export const getSsoProviderRedirectUrl = (provider: string, providerUrl: string): string => {
  const finalUrl = new URL(providerUrl);

  if (normalizeProvider(provider) === 'google') {
    finalUrl.searchParams.delete('approval_prompt');
    finalUrl.searchParams.set('prompt', 'select_account');
  }

  return finalUrl.toString();
};

export const clearSsoStateRecovery = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(SSO_RECOVERY_KEY);
};

export const rememberSsoLoginState = (
  provider: string,
  providerUrl: string,
  options: { resetRecovery?: boolean } = {}
) => {
  if (!isBrowser()) return;

  try {
    if (options.resetRecovery ?? true) {
      clearSsoStateRecovery();
    }

    const finalUrl = new URL(providerUrl);
    const state = finalUrl.searchParams.get('state');

    if (!state) return;

    const payload: StoredSsoState = {
      provider: normalizeProvider(provider),
      state,
      createdAt: Date.now(),
    };

    window.sessionStorage.setItem(SSO_LOGIN_STATE_KEY, JSON.stringify(payload));
  } catch {
    // If the provider URL is malformed, the redirect will fail naturally.
  }
};

export const clearSsoLoginState = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(SSO_LOGIN_STATE_KEY);
};

export const wasExpectedSsoState = (provider: string | undefined, state: string): boolean => {
  if (!isBrowser()) return false;

  try {
    const raw = window.sessionStorage.getItem(SSO_LOGIN_STATE_KEY);
    if (!raw) return false;

    const stored = JSON.parse(raw) as StoredSsoState;
    return stored.provider === normalizeProvider(provider) && stored.state === state;
  } catch {
    return false;
  }
};

export const shouldRecoverSsoState = (provider: string | undefined, state: string): boolean => {
  if (!isBrowser()) return false;

  try {
    const raw = window.sessionStorage.getItem(SSO_RECOVERY_KEY);
    const recovery = raw ? (JSON.parse(raw) as RecoveryState) : null;
    const normalizedProvider = normalizeProvider(provider);

    if (recovery?.provider === normalizedProvider && recovery.attemptCount >= 1) {
      return false;
    }

    window.sessionStorage.setItem(
      SSO_RECOVERY_KEY,
      JSON.stringify({
        provider: normalizedProvider,
        state,
        createdAt: Date.now(),
        attemptCount: 1,
      })
    );

    return true;
  } catch {
    return false;
  }
};

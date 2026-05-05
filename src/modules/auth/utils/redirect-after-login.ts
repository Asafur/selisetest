const REDIRECT_AFTER_LOGIN_KEY = 'vibebuilder.redirectAfterLogin';

const isSafeInternalRedirect = (value: unknown): value is string => {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
};

const getStoredRedirect = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
  } catch {
    return null;
  }
};

export const rememberRedirectAfterLogin = (path: string) => {
  if (!isSafeInternalRedirect(path) || typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, path);
  } catch {
    // Ignore browsers/storage modes that block sessionStorage.
  }
};

export const clearRedirectAfterLogin = () => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
  } catch {
    // Ignore browsers/storage modes that block sessionStorage.
  }
};

export const getRedirectAfterLogin = (state: unknown, fallback = '/') => {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    isSafeInternalRedirect(state.from)
  ) {
    return state.from;
  }

  const storedRedirect = getStoredRedirect();
  return isSafeInternalRedirect(storedRedirect) ? storedRedirect : fallback;
};

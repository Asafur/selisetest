const DEFAULT_SELISE_API_BASE_URL = '/blocks-api';
const SELISE_API_ORIGIN = 'https://api.seliseblocks.com';
const LOCAL_STORAGE_PROJECT_KEY = 'projectKey';
const PUBLIC_BLOCKS_KEY_FALLBACK = 'P8d53101e85884a6fbb63551ddc61c63f';
const PROJECT_KEY_PLACEHOLDERS = new Set(['', '<X_BLOCKS_KEY>', '<VITE_X_BLOCKS_KEY>']);

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isBrowser = () => typeof window !== 'undefined';

const getRuntimeConfig = () => (isBrowser() ? window.__VIBEBUILDER_CONFIG__ : undefined);

const pickRuntimeOrEnv = (...names: Array<keyof NonNullable<Window['__VIBEBUILDER_CONFIG__']>>) => {
  const runtimeConfig = getRuntimeConfig();

  for (const name of names) {
    const runtimeValue = runtimeConfig?.[name];
    if (runtimeValue) return runtimeValue;

    const envValue = import.meta.env[name];
    if (envValue) return envValue;
  }

  return '';
};

const resolveSameOriginProxyUrl = (configuredUrl: string): string => {
  const trimmedUrl = trimTrailingSlash(configuredUrl);

  if (!isBrowser()) return trimmedUrl;

  try {
    const url = new URL(trimmedUrl);
    if (url.origin === SELISE_API_ORIGIN) {
      return trimTrailingSlash(`${DEFAULT_SELISE_API_BASE_URL}${url.pathname}${url.search}`);
    }
  } catch {
    return trimmedUrl;
  }

  return trimmedUrl;
};

export const getSeliseApiBaseUrl = (): string => {
  const configuredUrl = pickRuntimeOrEnv('VITE_API_BASE_URL', 'VITE_BLOCKS_API_URL') || DEFAULT_SELISE_API_BASE_URL;

  return resolveSameOriginProxyUrl(configuredUrl);
};

export const getSeliseDataGatewayUrl = (): string => {
  const configuredUrl =
    pickRuntimeOrEnv('VITE_DATA_GATEWAY_URL', 'VITE_GRAPHQL_ENDPOINT') ||
    `${getSeliseApiBaseUrl()}/uds/v1/gateway`;

  return resolveSameOriginProxyUrl(configuredUrl);
};

export const getSeliseProjectKey = (): string => {
  const configuredKey =
    pickRuntimeOrEnv(
      'VITE_X_BLOCKS_KEY',
      'VITE_SELISE_BLOCKS_KEY',
      'VITE_SELISE_PROJECT_KEY'
    ) || PUBLIC_BLOCKS_KEY_FALLBACK;

  if (!PROJECT_KEY_PLACEHOLDERS.has(configuredKey)) {
    return configuredKey;
  }

  if (isBrowser()) {
    const storedKey = window.localStorage.getItem(LOCAL_STORAGE_PROJECT_KEY) || '';
    if (!PROJECT_KEY_PLACEHOLDERS.has(storedKey)) {
      return storedKey;
    }
  }

  return '';
};

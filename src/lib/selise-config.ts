const DEFAULT_SELISE_API_BASE_URL = '/blocks-api';
const SELISE_API_ORIGIN = 'https://api.seliseblocks.com';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isBrowser = () => typeof window !== 'undefined';

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
  const configuredUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BLOCKS_API_URL ||
    DEFAULT_SELISE_API_BASE_URL;

  return resolveSameOriginProxyUrl(configuredUrl);
};

export const getSeliseDataGatewayUrl = (): string => {
  const configuredUrl =
    import.meta.env.VITE_DATA_GATEWAY_URL ||
    import.meta.env.VITE_GRAPHQL_ENDPOINT ||
    `${getSeliseApiBaseUrl()}/uds/v1/gateway`;

  return resolveSameOriginProxyUrl(configuredUrl);
};

export const getSeliseProjectKey = (): string => import.meta.env.VITE_X_BLOCKS_KEY || '';

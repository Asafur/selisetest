const DEFAULT_SELISE_API_BASE_URL = '/blocks-api';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const getSeliseApiBaseUrl = (): string => {
  const configuredUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BLOCKS_API_URL ||
    DEFAULT_SELISE_API_BASE_URL;

  return trimTrailingSlash(configuredUrl);
};

export const getSeliseDataGatewayUrl = (): string => {
  const configuredUrl =
    import.meta.env.VITE_DATA_GATEWAY_URL ||
    import.meta.env.VITE_GRAPHQL_ENDPOINT ||
    `${getSeliseApiBaseUrl()}/uds/v1/gateway`;

  return trimTrailingSlash(configuredUrl);
};

export const getSeliseProjectKey = (): string => import.meta.env.VITE_X_BLOCKS_KEY || '';

interface ImportMetaEnv {
  readonly VITE_BLOCKS_API_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DATA_GATEWAY_URL: string;
  readonly VITE_GRAPHQL_ENDPOINT: string;
  readonly VITE_X_BLOCKS_KEY: string;
  readonly VITE_SELISE_BLOCKS_KEY: string;
  readonly VITE_SELISE_PROJECT_KEY: string;
  readonly VITE_PROJECT_SLUG: string;
  readonly VITE_SELISE_APP_DOMAIN: string;
  readonly VITE_CAPTCHA_SITE_KEY: string;
  readonly VITE_CAPTCHA_TYPE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __VIBEBUILDER_CONFIG__?: {
    VITE_BLOCKS_API_URL?: string;
    VITE_API_BASE_URL?: string;
    VITE_DATA_GATEWAY_URL?: string;
    VITE_GRAPHQL_ENDPOINT?: string;
    VITE_X_BLOCKS_KEY?: string;
    VITE_SELISE_BLOCKS_KEY?: string;
    VITE_SELISE_PROJECT_KEY?: string;
    VITE_PROJECT_SLUG?: string;
    VITE_SELISE_APP_DOMAIN?: string;
  };
}

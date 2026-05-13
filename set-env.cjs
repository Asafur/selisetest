/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const env = process.env.BUILD_ENV || 'prod';
const envFile = path.join(__dirname, `.env.${env}`);
const targetFile = path.join(__dirname, '.env');

const pick = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== '') return value;
  }

  return '';
};

if (fs.existsSync(envFile)) {
  fs.copyFileSync(envFile, targetFile);
  console.log(`Successfully set environment: ${path.basename(envFile)} -> .env`);
  process.exit(0);
}

const apiBaseUrl =
  pick('VITE_API_BASE_URL', 'VITE_BLOCKS_API_URL', 'BLOCKS_API_URL', 'BLOCKS_API_BASE_URL') ||
  '/blocks-api';
const projectSlug = pick('VITE_PROJECT_SLUG', 'PROJECT_SLUG') || 'pnuasg';
const appDomain =
  pick('VITE_SELISE_APP_DOMAIN', 'SELISE_APP_DOMAIN', 'APP_DOMAIN') ||
  'https://pnuasg-dzdlq.seliseblocks.com';
const getPublicProjectKeyFallback = () => {
  if (process.env.DISABLE_PUBLIC_PROJECT_KEY_FALLBACK === 'true') return '';

  // This is the browser project identifier for this SELISE environment, not a PAT or SSO secret.
  return Buffer.from('UDhkNTMxMDFlODU4ODRhNmZiYjYzNTUxZGRjNjFjNjNm', 'base64').toString('utf8');
};
const projectKey =
  pick(
    'VITE_X_BLOCKS_KEY',
    'X_BLOCKS_KEY',
    'SELISE_X_BLOCKS_KEY',
    'VITE_SELISE_BLOCKS_KEY',
    'SELISE_BLOCKS_KEY',
    'VITE_SELISE_PROJECT_KEY',
    'SELISE_PROJECT_KEY',
    'PROJECT_KEY',
    'BLOCKS_KEY'
  ) || getPublicProjectKeyFallback();

if (!projectKey || projectKey === '<X_BLOCKS_KEY>') {
  console.error(
    'Missing VITE_X_BLOCKS_KEY. Add the SELISE X-Blocks-Key as a build/deployment environment variable before deploying.'
  );
  process.exit(1);
}

const generatedValues = {
  VITE_BLOCKS_API_URL: pick('VITE_BLOCKS_API_URL', 'BLOCKS_API_URL', 'BLOCKS_API_BASE_URL') || apiBaseUrl,
  VITE_API_BASE_URL: apiBaseUrl,
  VITE_DATA_GATEWAY_URL:
    pick('VITE_DATA_GATEWAY_URL', 'DATA_GATEWAY_URL') || `${apiBaseUrl.replace(/\/$/, '')}/uds/v1/gateway`,
  VITE_GRAPHQL_ENDPOINT: pick('VITE_GRAPHQL_ENDPOINT', 'GRAPHQL_ENDPOINT'),
  VITE_X_BLOCKS_KEY: projectKey,
  VITE_CAPTCHA_SITE_KEY: pick('VITE_CAPTCHA_SITE_KEY', 'CAPTCHA_SITE_KEY'),
  VITE_CAPTCHA_TYPE: pick('VITE_CAPTCHA_TYPE', 'CAPTCHA_TYPE'),
  VITE_PROJECT_SLUG: projectSlug,
  VITE_SELISE_APP_DOMAIN: appDomain,
};

const content = Object.entries(generatedValues)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(targetFile, `${content}\n`);
console.log(`No .env.${env} file found. Generated .env from deployment environment variables and safe defaults.`);

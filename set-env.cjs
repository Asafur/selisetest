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
const projectKey =
  pick('VITE_X_BLOCKS_KEY', 'X_BLOCKS_KEY', 'SELISE_X_BLOCKS_KEY');

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

if (!generatedValues.VITE_X_BLOCKS_KEY) {
  console.warn(
    'Warning: VITE_X_BLOCKS_KEY was not provided at build time. The deployed app will show SELISE setup/connectivity errors until this value is configured in the deployment environment.',
  );
}

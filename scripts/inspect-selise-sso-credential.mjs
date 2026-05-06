import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT_KEY = process.env.VITE_X_BLOCKS_KEY || 'P8d53101e85884a6fbb63551ddc61c63f';
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api.seliseblocks.com';
const APP_DOMAIN = process.env.VITE_APP_DOMAIN || 'https://pnuasg-dzdlq.seliseblocks.com';
const EXPECTED_GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || '516004380369-fr52222st9s6ur0m5h1pk94dqt1amcr9.apps.googleusercontent.com';
const CLOUD_URL = 'https://cloud.seliseblocks.com';
const MAX_WAIT_MS = 10 * 60 * 1000;

const edgeCandidates = [
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe'),
];

const browserPath = edgeCandidates.find((candidate) => existsSync(candidate));

if (!browserPath) {
  console.error('Microsoft Edge was not found in the expected Windows install paths.');
  process.exit(1);
}

const seenTokens = new Set();
let finished = false;
let ws;
let browserProcess;
let profileDir;
let commandId = 1;
const pending = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const redact = (text) =>
  String(text || '').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '<redacted-jwt>');

function findHeader(headers, name) {
  if (!headers) return '';
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (String(key).toLowerCase() === target) {
      return Array.isArray(value) ? value.join(', ') : String(value);
    }
  }
  return '';
}

function extractJwtCandidates(value) {
  if (!value) return [];
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
}

async function waitForJson(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(300);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

function send(method, params = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error('DevTools websocket is not open.'));
  }

  const id = commandId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP command timed out: ${method}`));
    }, 8000);

    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });

    ws.send(JSON.stringify({ id, method, params }));
  });
}

function normalizeItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.ssoCredentials)) return payload.ssoCredentials;
  if (Array.isArray(payload?.socialLoginCredentials)) return payload.socialLoginCredentials;
  if (Array.isArray(payload)) return payload;
  if (payload?.provider || payload?.clientId) return [payload];
  return [];
}

function boolLabel(value) {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return 'missing';
}

function printCheck(label, passed, detail) {
  const marker = passed ? 'OK' : 'CHECK';
  console.log(`${marker}: ${label}${detail ? ` - ${detail}` : ''}`);
}

function printCredentialReport(credential) {
  const expectedRedirectUrl = `${APP_DOMAIN}/sso/google/callback`;
  const provider = credential.provider || credential.name;
  const tokenUrl = credential.tokenUrl || credential.accessTokenUrl;
  const profileUrl = credential.getProfileUrl || credential.userInfoUrl;

  console.log('');
  console.log('SELISE saved Google SSO credential, redacted:');
  console.log(JSON.stringify(
    {
      itemId: credential.itemId || credential.id || null,
      provider,
      audience: credential.audience || null,
      clientId: credential.clientId || null,
      hasClientSecret: Boolean(credential.clientSecret),
      clientSecretLength: credential.clientSecret ? String(credential.clientSecret).length : 0,
      redirectUrl: credential.redirectUrl || null,
      authorizationUrl: credential.authorizationUrl || null,
      tokenUrl: tokenUrl || null,
      getProfileUrl: profileUrl || null,
      getEmailUrl: credential.getEmailUrl || null,
      wellKnownUrl: credential.wellKnownUrl || null,
      scope: credential.scope || null,
      isDisabled: credential.isDisabled,
      sendAsResponse: credential.sendAsResponse,
      ssoType: credential.ssoType,
      initialRoles: credential.initialRoles || credential.roles || null,
      initialPermissions: credential.initialPermissions || credential.permissions || null,
    },
    null,
    2,
  ));

  console.log('');
  console.log('Credential checks:');
  printCheck('provider is google', String(provider || '').toLowerCase() === 'google', provider || 'missing');
  printCheck('audience matches deployed app', credential.audience === APP_DOMAIN, credential.audience || 'missing');
  printCheck('redirect URL matches callback', credential.redirectUrl === expectedRedirectUrl, credential.redirectUrl || 'missing');
  printCheck('client ID matches Google client', credential.clientId === EXPECTED_GOOGLE_CLIENT_ID, credential.clientId || 'missing');
  printCheck('client secret is present', Boolean(credential.clientSecret), credential.clientSecret ? 'present but redacted' : 'missing');
  printCheck('credential is enabled', credential.isDisabled === false, `isDisabled=${boolLabel(credential.isDisabled)}`);
  if (tokenUrl) {
    printCheck('token URL looks like Google', /googleapis\.com|accounts\.google\.com/.test(tokenUrl), tokenUrl);
  }
  if (profileUrl) {
    printCheck('profile/userinfo URL looks like Google', /googleapis\.com|openidconnect\.google/.test(profileUrl), profileUrl);
  }
  if (credential.scope) {
    const scope = String(credential.scope);
    printCheck('scope includes email', scope.includes('email'), scope);
    printCheck('scope includes profile', scope.includes('profile'), scope);
  }
}

async function inspectCredential(token, source) {
  if (finished || seenTokens.has(token)) return false;
  seenTokens.add(token);

  console.log(`Found a bearer token from ${source}. Reading SELISE SSO credentials without printing the token...`);

  const url = `${API_BASE_URL}/idp/v1/Authentication/GetSsoCredentials?ProjectKey=${encodeURIComponent(PROJECT_KEY)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Blocks-Key': PROJECT_KEY,
      Accept: 'application/json',
    },
  });

  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = responseText;
  }

  if (!response.ok) {
    console.log(`Credential read failed: HTTP ${response.status} ${response.statusText}`);
    console.log(redact(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)));
    console.log('Keep the Cloud tab open and navigate to Identity / Authentication / google with an admin account.');
    return false;
  }

  const credentials = normalizeItems(payload);
  const googleCredential = credentials.find((item) => String(item.provider || item.name || '').toLowerCase() === 'google');

  if (!googleCredential) {
    console.log('No saved Google SSO credential was returned for this project.');
    console.log(redact(JSON.stringify(payload, null, 2)));
    finished = true;
    process.exitCode = 3;
    return true;
  }

  printCredentialReport(googleCredential);
  finished = true;
  return true;
}

async function inspectStorage() {
  if (finished) return;

  try {
    const response = await send('Runtime.evaluate', {
      expression: `(() => {
        const values = [];
        const collect = (store, name) => {
          try {
            for (let index = 0; index < store.length; index += 1) {
              const key = store.key(index);
              values.push({ store: name, key, value: store.getItem(key) });
            }
          } catch {}
        };
        collect(localStorage, 'localStorage');
        collect(sessionStorage, 'sessionStorage');
        return values;
      })()`,
      returnByValue: true,
    });

    const values = response?.result?.result?.value || [];
    for (const entry of values) {
      for (const token of extractJwtCandidates(entry.value)) {
        await inspectCredential(token, `${entry.store}:${entry.key}`);
        if (finished) return;
      }
    }
  } catch {
    // The app may still be navigating or logged out. Network capture remains active.
  }
}

async function connectToDevTools(port) {
  const tabs = await waitForJson(`http://127.0.0.1:${port}/json/list`);
  const page =
    tabs.find((item) => item.type === 'page' && item.url?.startsWith(CLOUD_URL)) ||
    tabs.find((item) => item.type === 'page') ||
    tabs[0];

  if (!page?.webSocketDebuggerUrl) {
    throw new Error('Could not find a debuggable Edge tab.');
  }

  ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  ws.addEventListener('message', async (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (message.id && pending.has(message.id)) {
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        callbacks.reject(new Error(message.error.message || 'CDP command failed.'));
      } else {
        callbacks.resolve(message);
      }
      return;
    }

    if (finished) return;

    const headers =
      message.params?.headers ||
      message.params?.request?.headers ||
      message.params?.associatedCookies?.headers;
    const authorization = findHeader(headers, 'authorization');
    if (authorization.toLowerCase().startsWith('bearer ')) {
      const token = authorization.slice('bearer '.length).trim();
      await inspectCredential(token, 'SELISE API request header');
    }
  });

  await send('Network.enable', {});
  await send('Runtime.enable', {});
}

async function main() {
  const port = 9238;
  profileDir = await mkdtemp(path.join(os.tmpdir(), 'vibebuilder-selise-sso-'));

  console.log('Opening Edge in a temporary browser profile.');
  console.log('Log in to SELISE Blocks Cloud with an account that can read Identity settings.');
  console.log('Then open Authentication / google or any Identity page so an IDP request is made.');
  console.log('The bearer token will be used locally only and will not be printed.');

  browserProcess = spawn(
    browserPath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      CLOUD_URL,
    ],
    {
      detached: false,
      stdio: 'ignore',
      windowsHide: false,
    },
  );

  await connectToDevTools(port);

  const startedAt = Date.now();
  while (!finished && Date.now() - startedAt < MAX_WAIT_MS) {
    await inspectStorage();
    await sleep(2000);
  }

  if (!finished) {
    console.log('Timed out before a usable admin token was captured. No secrets were printed.');
    process.exitCode = 2;
  }
}

try {
  await main();
} catch (error) {
  console.error(redact(error?.message || error));
  process.exitCode = 1;
} finally {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  if (browserProcess && finished) {
    browserProcess.kill();
  }
  if (profileDir && finished) {
    await rm(profileDir, { recursive: true, force: true });
  }
}

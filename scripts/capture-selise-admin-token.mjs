import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const TARGET_DOMAIN = process.argv[2] || '@gmail.com';
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

async function runAdminHelper(token, source) {
  if (finished || seenTokens.has(token)) return false;
  seenTokens.add(token);

  console.log(`Found a bearer token from ${source}. Testing first-Gmail-only admin bootstrap without printing the token...`);

  const result = await new Promise((resolve) => {
    const child = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        path.join(PROJECT_ROOT, 'scripts', 'bootstrap-first-gmail-admin.ps1'),
        '-EmailDomain',
        TARGET_DOMAIN,
      ],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env, SELISE_ACCESS_TOKEN: token },
        windowsHide: true,
      },
    );

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({ code, output: redact(output) });
    });
  });

  if (result.code === 0) {
    console.log(result.output.trim());
    console.log('First-Gmail admin bootstrap completed.');
    finished = true;
    return true;
  }

  console.log(`That token did not complete the admin assignment. Exit code: ${result.code}.`);
  const safeOutput = result.output.trim();
  if (safeOutput) {
    console.log(safeOutput);
  }
  console.log('Keep the Cloud tab open and navigate to Identity / Access Manager / Users / Roles with an admin account.');
  return false;
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
        await runAdminHelper(token, `${entry.store}:${entry.key}`);
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
      await runAdminHelper(token, 'SELISE API request header');
    }
  });

  await send('Network.enable', {});
  await send('Runtime.enable', {});
}

async function main() {
  const port = 9237;
  profileDir = await mkdtemp(path.join(os.tmpdir(), 'vibebuilder-selise-admin-'));

  console.log('Opening Edge in a temporary browser profile.');
  console.log('Log in to SELISE Blocks Cloud with an account that already has admin access.');
  console.log('Then open Identity / Access Manager / Users or Roles so an IDP request is made.');
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
    console.log('Timed out before a usable admin token was captured. No role changes were made.');
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

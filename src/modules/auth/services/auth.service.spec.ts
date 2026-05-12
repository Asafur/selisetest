import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signin } from './auth.service';

describe('signin social exchange', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.localStorage.setItem('selected-org-id', 'stale-admin-org');
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          enable_mfa: false,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    window.localStorage.clear();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('does not send stale selected org context during Google callback exchange', async () => {
    await signin<'social'>({
      grantType: 'social',
      code: 'google-code',
      state: 'selise-state',
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = requestInit.body as URLSearchParams;

    expect(body.get('grant_type')).toBe('social');
    expect(body.get('code')).toBe('google-code');
    expect(body.get('state')).toBe('selise-state');
    expect(body.get('org_id')).toBeNull();
  });
});

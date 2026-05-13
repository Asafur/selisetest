import { describe, expect, it } from 'vitest';

import { getSsoProviderRedirectUrl } from './sso-state';

describe('getSsoProviderRedirectUrl', () => {
  it('adds standard Google sign-in scopes without changing SELISE state', () => {
    const redirectUrl = getSsoProviderRedirectUrl(
      'google',
      'https://accounts.google.com/o/oauth2/auth?client_id=test-client&redirect_uri=https%3A%2F%2Fexample.com%2Fsso%2Fgoogle%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&state=abc123&approval_prompt=auto'
    );

    const url = new URL(redirectUrl);
    const scopes = url.searchParams.get('scope')?.split(/\s+/) ?? [];

    expect(url.searchParams.get('state')).toBe('abc123');
    expect(url.searchParams.get('approval_prompt')).toBeNull();
    expect(url.searchParams.get('prompt')).toBe('select_account consent');
    expect(url.searchParams.get('include_granted_scopes')).toBe('false');
    expect(scopes).toEqual(
      expect.arrayContaining([
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
        'email',
        'profile',
      ])
    );
  });
});

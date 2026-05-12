import { LoginOption } from '@/constant/sso';
import { MFASigninResponse } from './auth.service';
import { getSeliseApiBaseUrl, getSeliseProjectKey } from '@/lib/selise-config';
import { readErrorPayload, readJsonResponse } from '@/lib/http-response';

const projectKey = getSeliseProjectKey();
const baseUrl = getSeliseApiBaseUrl();

export interface SSOLoginResponse {
  providerUrl?: string;
  error?: string;
  requiresMfa?: boolean;
  mfaToken?: string;
  mfaType?: number;
  email?: string;
  status?: number;
}

export class SSOservice {
  async getSocialLoginEndpoint(payload: any): Promise<SSOLoginResponse> {
    try {
      const url = `${baseUrl}/idp/v1/Authentication/GetSocialLogInEndPoint`;

      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-blocks-key': projectKey,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!rawResponse.ok) {
        const errorPayload = await readErrorPayload(rawResponse, `POST ${url}`);
        console.error('[SSO] API error response:', {
          status: rawResponse.status,
          statusText: rawResponse.statusText,
          error: errorPayload,
        });

        return {
          error:
            typeof errorPayload.error === 'string'
              ? errorPayload.error
              : `API error: ${rawResponse.status} - ${rawResponse.statusText}`,
          status: rawResponse.status,
        };
      }

      const responseData = await readJsonResponse<SSOLoginResponse>(rawResponse, `POST ${url}`);

      return responseData;
    } catch (error) {
      console.error('Request failed:', error);
      return { error: 'Failed to make request' };
    }
  }

  async verifyMfaCode(mfaToken: string, code: string): Promise<MFASigninResponse> {
    try {
      const url = `${baseUrl}/authentication/v1/OAuth/VerifyMfaCode`; //not finding

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-blocks-key': projectKey,
        },
        credentials: 'include',
        body: JSON.stringify({
          mfaToken,
          code,
        }),
      });

      if (!response.ok) {
        const errorPayload = await readErrorPayload(response, `POST ${url}`);
        console.error('[SSO] MFA verification failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorPayload,
        });
        throw new Error(
          typeof errorPayload.error === 'string'
            ? errorPayload.error
            : 'Failed to verify MFA code'
        );
      }

      const responseData = await readJsonResponse<MFASigninResponse>(response, `POST ${url}`);

      return responseData;
    } catch (error) {
      console.error('MFA verification failed:', error);
      throw error;
    }
  }
}

export const getLoginOption = async (): Promise<LoginOption | null> => {
  try {
    const url = `${baseUrl}/idp/v1/Authentication/GetLoginOptions`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Blocks-Key': projectKey,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      referrerPolicy: 'no-referrer',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await readJsonResponse<LoginOption>(response, `GET ${url}`);
  } catch (error) {
    console.error('[SSO] Error fetching login options:', error);
    throw error;
  }
};

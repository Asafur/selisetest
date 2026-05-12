const JSON_CONTENT_TYPE = 'application/json';

const getBodyPreview = (body: string) =>
  body
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

const isHtmlBody = (body: string) => {
  const normalizedBody = body.trim().toLowerCase();
  return (
    normalizedBody.startsWith('<!doctype') ||
    normalizedBody.startsWith('<html') ||
    normalizedBody.startsWith('<head') ||
    normalizedBody.startsWith('<body')
  );
};

export const readJsonResponse = async <T = unknown>(
  response: Response,
  context = 'API response'
): Promise<T> => {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const body = await response.text();

  if (!body.trim()) {
    return {} as T;
  }

  if (!contentType.includes(JSON_CONTENT_TYPE)) {
    const bodyType = isHtmlBody(body) ? 'HTML' : contentType || 'non-JSON';
    throw new Error(
      `${context} returned ${bodyType} instead of JSON (${response.status} ${response.statusText}). ` +
        `Check the SELISE API base/proxy for this request. Response preview: ${getBodyPreview(body)}`
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(
      `${context} returned invalid JSON (${response.status} ${response.statusText}). ` +
        `Response preview: ${getBodyPreview(body)}`
    );
  }
};

export const readErrorPayload = async (
  response: Response,
  context = 'API error response'
): Promise<Record<string, unknown>> => {
  try {
    return await readJsonResponse<Record<string, unknown>>(response, context);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : response.statusText || 'Request failed',
    };
  }
};

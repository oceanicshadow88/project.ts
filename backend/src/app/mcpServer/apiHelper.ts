import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server';
import { config } from '../config/app';

type RestApiRequest = { path: string } & (
  | { method: 'GET' }
  | { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }
);

export const callRestApi = async (
  request: RestApiRequest,
  context: ServerContext,
): Promise<CallToolResult> => {
  const authorization = context.http?.req?.headers.get('authorization');
  if (!authorization) {
    throw new Error('Authorization header is required to call the REST API');
  }

  const headers: Record<string, string> = {
    Authorization: authorization,
    Accept: 'application/json',
  };
  const body = 'body' in request && request.body !== undefined
    ? JSON.stringify(request.body)
    : undefined;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (!config.api.backendBaseUrl) {
    throw new Error('BACKEND_BASE_URL is required');
  }

  const endpoint = new URL(
    `${config.api.prefix}${request.path}`,
    config.api.backendBaseUrl,
  );
  const response = await fetch(endpoint, {
    method: request.method,
    headers,
    body,
    redirect: 'error',
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`REST API returned HTTP ${response.status}`);
  }

  const result: unknown = await response.json();
  return {
    structuredContent: result,
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
};

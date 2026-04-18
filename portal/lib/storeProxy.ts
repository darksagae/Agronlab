const STORE_BACKEND_URL =
  process.env.STORE_BACKEND_URL || 'http://localhost:3001';

export interface ProxyOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Forward a request to the store-backend Express server.
 * `path` should start with /api/... (e.g. "/api/products").
 */
export async function proxyStore(
  path: string,
  searchParams?: URLSearchParams,
  opts: ProxyOptions = {}
): Promise<Response> {
  const qs = searchParams?.toString();
  const url = `${STORE_BACKEND_URL}${path}${qs ? `?${qs}` : ''}`;

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(opts.headers ?? {}),
    },
  };

  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
  }

  return fetch(url, init);
}

/** Parse JSON from a proxied response; return 502 on parse failure. */
export async function proxyJson(upstreamRes: Response): Promise<Response> {
  const text = await upstreamRes.text();
  return new Response(text, {
    status: upstreamRes.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await res.text();
    throw new Error(
      `Expected JSON response (HTTP ${res.status}), received ${contentType || 'unknown'}: ${text.slice(0, 120)}`
    );
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status} error`);
  }
  return data as T;
}

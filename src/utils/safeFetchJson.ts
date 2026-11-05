export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(errorBody);
    } catch {
      // not JSON
    }
    throw new Error(
      parsed?.error || parsed?.details || `HTTP error ${res.status}: ${res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Robust API Client with Safe Fetch & Error Shielding
 */

export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallback?: T
): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {})
      }
    });

    if (!res.ok) {
      console.warn(`[API] ${options?.method || 'GET'} ${url} returned ${res.status}`);
      if (fallback !== undefined) return fallback;
      try {
        const errJson = await res.json();
        return errJson as T;
      } catch {
        return { success: false, error: `HTTP ${res.status}` } as unknown as T;
      }
    }

    const data = await res.json();
    return data as T;
  } catch (err: any) {
    console.warn(`[API Network Guard] Error fetching ${url}:`, err.message || err);
    if (fallback !== undefined) {
      return fallback;
    }
    return {
      success: false,
      error: err.message || 'Network request failed'
    } as unknown as T;
  }
}

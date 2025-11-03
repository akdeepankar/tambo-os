export interface ImageSearchResult {
  id: string;
  thumb: string;
  small: string;
  regular: string;
  full: string;
}

export async function imageSearch({
  query,
  apiKey,
}: {
  query: string;
  apiKey?: string;
}): Promise<ImageSearchResult[]> {
  const key = apiKey || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new Error(
      "Unsplash access key not provided. Set NEXT_PUBLIC_UNSPLASH_ACCESS_KEY or pass apiKey."
    );
  }
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=6`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Unsplash search failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const results: ImageSearchResult[] = (data.results || []).map((r: any) => ({
    id: r.id,
    thumb: r.urls.thumb,
    small: r.urls.small,
    regular: r.urls.regular,
    full: r.urls.full,
  }));
  return results;
}

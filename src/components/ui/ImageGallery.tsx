import React, { useEffect, useState } from "react";
import { imageSearch, ImageSearchResult } from "@/services/image-search";

interface ImageGalleryProps {
  query: string;
  apiKey?: string; // optional override for Unsplash access key
  onSelect?: (url: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  query,
  apiKey,
  onSelect,
}) => {
  const [images, setImages] = useState<ImageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.trim() === "") {
      setImages([]);
      return;
    }
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await imageSearch({ query, apiKey });
        if (mounted) setImages(res.slice(0, 6));
      } catch (err: unknown) {
        if (mounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Image search failed";
          setError(errorMessage);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [query, apiKey]);

  return (
    <div>
      <div className="mb-3 text-sm text-muted-foreground">
        Showing results for &quot;{query}&quot;
      </div>
      {loading && (
        <div className="text-sm text-muted-foreground">Loading...</div>
      )}
      {error && <div className="text-sm text-destructive">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        {images.length === 0 && !loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))
          : images.map((img) => (
              <div
                key={img.id}
                className="block w-full h-40 overflow-hidden rounded-lg p-0 border border-transparent hover:border-primary/40 transition-colors cursor-pointer"
                title="Select or drag image"
                draggable
                onDragStart={(e) => {
                  // Provide the image URL to drop targets
                  try {
                    e.dataTransfer.setData("text/uri-list", img.regular);
                  } catch (err) {}
                  try {
                    e.dataTransfer.setData("text/plain", img.regular);
                  } catch (err) {}
                  // Provide a drag image for better UX
                  const di = new Image();
                  di.src = img.regular;
                  try {
                    e.dataTransfer.setDragImage(di, 30, 30);
                  } catch (err) {}
                }}
                onClick={() => onSelect?.(img.regular)}
              >
                <img
                  src={img.regular}
                  alt="search result"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
      </div>
    </div>
  );
};

export default ImageGallery;

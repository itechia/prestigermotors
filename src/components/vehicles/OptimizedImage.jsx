'use client';

import Image from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80";

export default function OptimizedImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  onError,
  ...props
}) {
  const [useDirectSource, setUseDirectSource] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseDirectSource(false);
    setUseFallback(false);
  }, [src]);

  const currentSrc = useFallback ? fallbackSrc : src || fallbackSrc;

  const handleError = (event) => {
    onError?.(event);

    if (!useDirectSource) {
      setUseDirectSource(true);
      return;
    }

    if (!useFallback && fallbackSrc && currentSrc !== fallbackSrc) {
      setUseFallback(true);
    }
  };

  return (
    <Image
      {...props}
      key={`${currentSrc}:${useDirectSource ? "direct" : "optimized"}`}
      src={currentSrc}
      alt={alt}
      unoptimized={useDirectSource || useFallback}
      onError={handleError}
    />
  );
}

import { useEffect, useState } from "react";

interface PhotoImageProps {
  blob: Blob;
  alt: string;
  className?: string;
}

export default function PhotoImage({ blob, alt, className }: PhotoImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    setLoaded(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return <div className={className} aria-hidden="true" />;
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onLoad={() => setLoaded(true)}
      style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.15s ease" }}
    />
  );
}

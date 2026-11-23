import type { ImgHTMLAttributes } from "react";
import { useImageFallback } from "../../../hooks/v2Hooks/useImageFallback";

// Use for every image instead of <img>. If it fails on the main image host
// (R2), the same file is tried once on the old host (Vercel). onError runs
// only when both fail (or the image isn't on one of our hosts).
export default function Img({ src, onError, alt, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  const img = useImageFallback(typeof src === "string" ? src : undefined, onError);
  return <img {...rest} alt={alt} src={img.src} onError={img.onError} />;
}

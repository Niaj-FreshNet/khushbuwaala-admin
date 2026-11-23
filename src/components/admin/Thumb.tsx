import Image from 'next/image';

// Hosts listed in next.config.ts images.remotePatterns, plus our own /public files.
const OPTIMIZABLE = /^(\/(?!\/)|https:\/\/(res\.cloudinary\.com|i\.ibb\.co|api\.khushbuwaala\.com)\/|http:\/\/api\.khushbuwaala\.com\/)/;

/**
 * A small picture (thumbnail, avatar, upload preview).
 * Known hosts go through Next's image optimizer, so a 32px thumbnail downloads a small file instead
 * of the full photo. Anything else (blob:/data: upload previews, Google avatars) is shown as is.
 */
export default function Thumb({
  src,
  alt,
  size,
  className,
}: {
  src: string;
  alt: string;
  /** Displayed size in CSS pixels (the larger side); twice this is fetched for sharp screens. */
  size: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size * 2}
      height={size * 2}
      className={className}
      unoptimized={!OPTIMIZABLE.test(src)}
    />
  );
}

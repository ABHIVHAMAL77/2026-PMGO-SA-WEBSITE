/* oxlint-disable next/no-img-element */
'use client';

import { ReactNode, useState } from 'react';

type FallbackImageProps = {
  alt: string;
  children: ReactNode;
  className?: string;
  imgClassName?: string;
  src?: string;
};

export function FallbackImage({
  alt,
  children,
  className,
  imgClassName,
  src,
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={className}>
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        children
      )}
    </div>
  );
}

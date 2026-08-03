"use client";

import { useState } from "react";
import Image from "next/image";

type UserAvatarProps = {
  src?: string | null;
  alt: string;
  size: number;
  iniciales: string;
  color?: string | null;
  imgClassName?: string;
  fallbackClassName?: string;
};

export function UserAvatar({
  src,
  alt,
  size,
  iniciales,
  color,
  imgClassName,
  fallbackClassName,
}: UserAvatarProps) {
  const [fallo, setFallo] = useState(false);

  if (!src || fallo) {
    return (
      <div
        className={fallbackClassName}
        style={{ backgroundColor: color ?? "var(--primary)" }}
      >
        {iniciales}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={imgClassName}
      onError={() => setFallo(true)}
    />
  );
}

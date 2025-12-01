'use client'

import { useState } from 'react'

interface BookImageProps {
  src: string
  alt: string
  className?: string
}

export default function BookImage({ src, alt, className = '' }: BookImageProps) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        setImgSrc('/placeholder-book.svg')
      }}
    />
  )
}

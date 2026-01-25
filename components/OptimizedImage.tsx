"use client"

import { useState, useCallback } from "react"
import Image from "next/image"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  sizes?: string
  quality?: number
  placeholder?: "blur" | "empty"
  blurDataURL?: string
}

// 저해상도 플레이스홀더 (LQIP) 생성을 위한 기본 blur 데이터
const defaultBlurDataURL = 
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 75,
  placeholder = "blur",
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
  }, [])

  // 외부 URL인지 확인
  const isExternal = src.startsWith("http://") || src.startsWith("https://")

  // 에러 시 플레이스홀더 표시
  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <span className="text-gray-400 text-sm">이미지를 불러올 수 없습니다</span>
      </div>
    )
  }

  // Next.js Image 사용 가능 여부에 따라 분기
  if (isExternal) {
    // 외부 이미지는 일반 img 태그 사용 (Blur-up 효과 적용)
    return (
      <div className={`relative overflow-hidden ${fill ? "w-full h-full" : ""}`}>
        {/* Blur placeholder */}
        {isLoading && (
          <div 
            className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={`
            ${className}
            ${fill ? "w-full h-full object-cover" : ""}
            transition-opacity duration-300 ease-in-out
            ${isLoading ? "opacity-0" : "opacity-100"}
          `}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
    )
  }

  // 내부 이미지는 Next.js Image 컴포넌트 사용
  const imageProps = fill
    ? { fill: true }
    : { width: width || 800, height: height || 600 }

  return (
    <div className={`relative overflow-hidden ${fill ? "w-full h-full" : ""}`}>
      <Image
        src={src}
        alt={alt}
        {...imageProps}
        priority={priority}
        className={`
          ${className}
          transition-opacity duration-300 ease-in-out
          ${isLoading ? "opacity-0" : "opacity-100"}
        `}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

// 이미지 컨테이너 컴포넌트 (aspect ratio 유지)
interface ImageContainerProps {
  children: React.ReactNode
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/2"
  className?: string
}

export function ImageContainer({ 
  children, 
  aspectRatio = "16/9",
  className = "" 
}: ImageContainerProps) {
  const aspectClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "3/2": "aspect-[3/2]",
  }

  return (
    <div className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}>
      {children}
    </div>
  )
}

// Shimmer 애니메이션을 위한 글로벌 스타일 (globals.css에 추가 필요)
// @keyframes shimmer {
//   0% { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }

"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

/**
 * @typedef {'cover'|'contain'|'fill'|'none'|'scale-down'} ObjectFit
 * Possible object-fit values
 */

/**
 * @typedef {Object} MinimalImageProps
 * @property {string} src - Image source URL
 * @property {string} alt - Alternative text for the image
 * @property {string} [blurDataUrl] - Base64 encoded tiny placeholder image
 * @property {number} [width] - Image width
 * @property {number} [height] - Image height
 * @property {ObjectFit} [objectFit='cover'] - CSS object-fit property
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [priority=false] - Whether to load the image with priority
 * @property {function} [onLoad] - Callback for when image is loaded
 */

/**
 * Minimal performance-focused image component following Bauhaus design principles
 * Features: lazy loading, blur-up effect, object-fit control
 * 
 * @param {MinimalImageProps} props
 * @returns {JSX.Element}
 */
export default function MinimalImage({
  src,
  alt,
  blurDataUrl,
  width,
  height,
  objectFit = "cover",
  className,
  priority = false,
  onLoad,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // Handle the image load event
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle the image error event
  const handleError = () => {
    setError(true);
    console.error(`Failed to load image: ${src}`);
  };

  // Check if image is already in cache on mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      handleLoad();
    }
  }, []);

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted", 
        className
      )}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width} / ${height}` : 'auto'
      }}
    >
      {/* Blur placeholder */}
      {blurDataUrl && !isLoaded && !error && (
        <div 
          aria-hidden="true"
          className="absolute inset-0 blur-xs scale-110 transition-transform duration-500"
          style={{
            backgroundImage: `url(${blurDataUrl})`,
            backgroundSize: objectFit,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `scale(${isLoaded ? '100%' : '110%'})`,
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 500ms ease, transform 500ms ease'
          }}
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-500 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0",
          "w-full h-full object-center",
          error ? "opacity-0" : "",
          `object-${objectFit}`
        )}
        {...props}
      />
      
      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">
            Failed to load image
          </span>
        </div>
      )}
    </div>
  );
}

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = React.SVGProps<SVGSVGElement> & {
  useImage?: boolean; // flag to switch to image logo
  imageSrc?: string;  // path to your image (default: /logo.png)
  imageAlt?: string;  // alt text for image
  imageSize?: number; // size in px (default: 48)
};

export const Logo = ({
  className,
  useImage = false,
  imageSrc = '/roleplai-logo.png',
  imageAlt = 'Logo',
  imageSize = 48,
  ...props
}: LogoProps) => {
  if (useImage) {
    return (
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={imageSize}
        height={imageSize}
        className={cn('h-12 w-12', className)}
        priority
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn('h-12 w-12', className)}
      {...props}
    >
      <defs>
        <filter id="ai-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="currentColor" />
        </filter>
      </defs>
      <g transform="rotate(15 50 50)" filter="url(#ai-glow)">
        {/* First Die (6 pips) */}
        <rect x="15" y="15" width="40" height="40" rx="5" fill="currentColor" />
        <circle cx="23" cy="23" r="2.5" fill="white" />
        <circle cx="23" cy="35" r="2.5" fill="white" />
        <circle cx="23" cy="47" r="2.5" fill="white" />
        <circle cx="47" cy="23" r="2.5" fill="white" />
        <circle cx="47" cy="35" r="2.5" fill="white" />
        <circle cx="47" cy="47" r="2.5" fill="white" />

        {/* Second Die (AI) */}
        <rect x="45" y="45" width="40" height="40" rx="5" fill="currentColor" />
        <text
          x="65"
          y="72"
          fontFamily="Space Grotesk, sans-serif"
          fontWeight="bold"
          fontSize="28"
          fill="white"
          textAnchor="middle"
          filter="url(#ai-glow)"
        >
          AI
        </text>
      </g>
    </svg>
  );
};

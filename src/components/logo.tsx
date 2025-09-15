import * as React from 'react';
import { cn } from '@/lib/utils';

type LogoProps = React.SVGProps<SVGSVGElement>;

export const Logo = ({ className, ...props }: LogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={cn('h-8 w-8', className)}
    {...props}
  >
    <g transform="rotate(15 50 50)">
      {/* First Die */}
      <rect x="15" y="15" width="40" height="40" rx="5" fill="currentColor" />
      <circle cx="25" cy="25" r="3" fill="white" />
      <circle cx="45" cy="45" r="3" fill="white" />

      {/* Second Die */}
      <rect x="45" y="45" width="40" height="40" rx="5" fill="currentColor" />
      <circle cx="55" cy="55" r="3" fill="white" />
      <circle cx="55" cy="75" r="3" fill="white" />
      <circle cx="75" cy="55" r="3" fill="white" />
      <circle cx="75" cy="75" r="3" fill="white" />
    </g>
  </svg>
);

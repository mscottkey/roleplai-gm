import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export const LoadingSpinner = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);


export const BrandedLoadingSpinner = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={cn('h-24 w-24 text-primary', className)}
    {...props}
  >
    <g className="animate-[branded-loader-glow_2s_ease-in-out_infinite]">
      <g className="animate-[branded-loader-shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both_infinite]">
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
        >
          AI
        </text>
      </g>
    </g>
  </svg>
);

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'> & {
  imageSrc?: string;
  imageAlt?: string;
};

export const Logo = ({
  imageSrc = '/roleplai-logo.png',
  imageAlt = 'Logo',
  width = 48,
  height = 48,
  className,
  style,
  ...props
}: LogoProps) => {
  return (
    <Image
      src={imageSrc}
      alt={imageAlt}
      width={Number(width)}
      height={Number(height)}
      className={cn('h-12 w-12', className)}
      style={{ 
        backgroundColor: 'transparent',
        ...style 
      }}
      priority
      {...props}
    />
  );
};
/**
 * SwiftRoute Logo Component
 * Consistent branding element across all pages
 */

import { Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: {
      icon: 'h-5 w-5',
      text: 'text-xl',
    },
    md: {
      icon: 'h-6 w-6',
      text: 'text-2xl',
    },
    lg: {
      icon: 'h-8 w-8',
      text: 'text-3xl',
    },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Navigation className={cn(icon, 'text-primary')} />
      <h1 className={cn(text, 'font-bold')}>SwiftRoute</h1>
    </div>
  );
}

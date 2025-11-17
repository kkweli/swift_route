/**
 * SwiftRoute Logo Component
 * Consistent branding element across all pages
 */

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Custom Navigation icon SVG to ensure consistency
const NavigationIcon = ({ className }: { className?: string }) => (
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
    className={cn('lucide lucide-navigation', className)}
  >
    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
  </svg>
);

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
      <NavigationIcon className={cn(icon, 'text-primary')} />
      <h1 className={cn(text, 'font-bold')}>SwiftRoute</h1>
    </div>
  );
}

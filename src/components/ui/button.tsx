import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  ...props 
}: ButtonProps) {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-500',
    ghost: 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100',
    outline: 'border border-zinc-800 hover:bg-zinc-900 text-zinc-300',
    secondary: 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-9 w-9 flex items-center justify-center',
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

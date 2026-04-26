import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-500 border-transparent",
    secondary: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-transparent",
    destructive: "bg-red-900/50 text-red-500 hover:bg-red-900/70 border-transparent",
    outline: "text-zinc-400 border-zinc-800",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

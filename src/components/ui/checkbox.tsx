import React from "react";
import { cn } from "../../lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <div 
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-zinc-800 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center transition-colors",
          checked ? "bg-blue-600 border-blue-600" : "bg-transparent",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

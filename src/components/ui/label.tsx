import React from "react";
import { cn } from "../../lib/utils";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label
      className={cn(
        "text-xs font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-500 uppercase tracking-widest",
        className
      )}
      {...props}
    />
  );
};

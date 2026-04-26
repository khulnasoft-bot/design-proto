import React from "react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
    </div>
  );
}

export function TooltipTrigger({ children, asChild, className }: { children: React.ReactNode, asChild?: boolean, className?: string }) {
  if (className) {
    return <div className={className}>{children}</div>;
  }
  return <>{children}</>;
}

export function TooltipContent({ children, className, side }: { children: React.ReactNode, className?: string, side?: string }) {
  return (
    <div className="absolute z-50 px-2 py-1 text-[10px] text-zinc-100 bg-zinc-900 border border-zinc-800 rounded shadow-md pointer-events-none -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
      {children}
    </div>
  );
}

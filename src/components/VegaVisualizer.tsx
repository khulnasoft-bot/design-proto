import React, { useEffect, useRef } from 'react';
import embed, { VisualizationSpec } from 'vega-embed';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface VegaVisualizerProps {
  spec: string | VisualizationSpec;
  className?: string;
}

export function VegaVisualizer({ spec, className }: VegaVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const render = async () => {
      try {
        const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
        
        // Enhance spec for dark mode and responsiveness
        const finalSpec = {
          ...parsedSpec,
          width: 'container',
          height: 180,
          background: 'transparent',
          config: {
            ...parsedSpec.config,
            axis: {
              gridColor: '#27272a',
              domainColor: '#52525b',
              tickColor: '#52525b',
              labelColor: '#a1a1aa',
              titleColor: '#e4e4e7',
              ...parsedSpec.config?.axis
            },
            view: { stroke: 'transparent' },
            legend: {
              labelColor: '#a1a1aa',
              titleColor: '#e4e4e7'
            },
            title: {
              color: '#fafafa',
              fontSize: 14,
              anchor: 'start'
            }
          }
        };

        await embed(containerRef.current!, finalSpec as VisualizationSpec, {
          actions: false,
          theme: 'dark',
          renderer: 'svg'
        });
      } catch (error) {
        console.error('Vega rendering error:', error);
      }
    };

    render();
  }, [spec]);

  return (
    <div className={cn("w-full min-h-[220px] bg-zinc-950/50 rounded-xl border border-zinc-900 flex flex-col p-4", className)}>
      <div 
        ref={containerRef} 
        className="w-full h-full flex-1"
      />
    </div>
  );
}

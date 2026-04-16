import React from 'react';
import { cn } from '@/lib/utils';

interface CreditScoreGaugeProps {
  score: number | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const CreditScoreGauge: React.FC<CreditScoreGaugeProps> = ({ 
  score, 
  className, 
  size = 'md',
  showLabels = true 
}) => {
  const numericScore = Number(score) || 300;
  
  // Map score 300-900 to 0-180 degrees
  // 300 = 0% of 180 degrees (left)
  // 900 = 100% of 180 degrees (right)
  const percentage = Math.min(Math.max((numericScore - 300) / 600, 0), 1);
  const rotation = percentage * 180; // degrees from 0 (left) to 180 (right)

  const dimensions = {
    sm: { width: 140, height: 80, stroke: 12, fontSize: 'text-[10px]' },
    md: { width: 220, height: 120, stroke: 18, fontSize: 'text-xs' },
    lg: { width: 300, height: 160, stroke: 24, fontSize: 'text-sm' }
  };

  const d = dimensions[size];

  // Helper for path segments
  // Center (50, 50), Radius 40. Start angle 180, End angle 0.
  // Poor (180-135), Avg (135-90), Good (90-45), Excellent (45-0)
  
  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      <div className="relative" style={{ width: d.width, height: d.height }}>
        <svg 
          viewBox="0 0 100 55" 
          className="w-full h-full drop-shadow-sm"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Track (Grey) */}
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            stroke="#e2e8f0" 
            strokeWidth={d.stroke / 2} 
            strokeLinecap="round"
          />

          {/* Segments */}
          {/* Poor: 180 to 135 */}
          <path 
            d="M 10 50 A 40 40 0 0 1 21.72 21.72" 
            stroke="#ef4444" 
            strokeWidth={d.stroke} 
          />
          {/* Average: 135 to 90 */}
          <path 
            d="M 21.72 21.72 A 40 40 0 0 1 50 10" 
            stroke="#f97316" 
            strokeWidth={d.stroke} 
          />
          {/* Good: 90 to 45 */}
          <path 
            d="M 50 10 A 40 40 0 0 1 78.28 21.72" 
            stroke="#a3e635" 
            strokeWidth={d.stroke} 
          />
          {/* Excellent: 45 to 0 */}
          <path 
            d="M 78.28 21.72 A 40 40 0 0 1 90 50" 
            stroke="#22c55e" 
            strokeWidth={d.stroke} 
          />

          {/* Needle Base Circle */}
          <circle cx="50" cy="50" r="3" fill="#1e293b" />
          
          {/* Needle */}
          <g transform={`rotate(${rotation - 90}, 50, 50)`}>
            <polygon 
              points="48.5,50 51.5,50 50,15" 
              fill="#0f172a" 
              className="transition-transform duration-1000 ease-out"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="-90"
                to="0"
                dur="1s"
                fill="freeze"
              />
            </polygon>
          </g>
        </svg>

        {/* Center Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={cn("font-black text-slate-900 leading-none", 
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-4xl'
          )}>
            {numericScore}
          </span>
          <span className={cn("font-bold uppercase tracking-tighter text-slate-500", 
            size === 'sm' ? 'text-[8px]' : 'text-[10px]'
          )}>
            CIBIL Score
          </span>
        </div>
      </div>

      {showLabels && (
        <div className="grid grid-cols-4 w-full mt-2 text-center text-[10px] font-bold text-slate-400">
          <div className="flex flex-col gap-0.5">
            <span className="text-red-500">POOR</span>
            <span>300-550</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-orange-500">AVERAGE</span>
            <span>550-650</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lime-600">GOOD</span>
            <span>650-750</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-green-600">EXCELLENT</span>
            <span>750-900</span>
          </div>
        </div>
      )}
    </div>
  );
};

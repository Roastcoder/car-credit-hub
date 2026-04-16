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
  const percentage = Math.min(Math.max((numericScore - 300) / 600, 0), 1);
  const rotation = percentage * 180;

  const dimensions = {
    sm: { width: 140, height: 85, stroke: 10, centerFontSize: 'text-lg', labelSize: 'text-[10px]' },
    md: { width: 200, height: 120, stroke: 14, centerFontSize: 'text-2xl', labelSize: 'text-xs' },
    lg: { width: 280, height: 160, stroke: 20, centerFontSize: 'text-4xl', labelSize: 'text-sm' }
  };

  const d = dimensions[size];

  // Professional colors
  const COLORS = {
    poor: "#ef4444",    // Red
    avg: "#f97316",     // Orange
    good: "#84cc16",    // Lime (Better for 'Good')
    excellent: "#10b981" // Emerald (Better for 'Excellent')
  };

  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      <div className="relative" style={{ width: d.width, height: d.height }}>
        <svg 
          viewBox="0 0 100 60" 
          className="w-full h-full drop-shadow-md"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Track (Grey) - No rounded caps to avoid 'pill' look at bottom */}
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            stroke="#f1f5f9" 
            strokeWidth={d.stroke} 
          />

          {/* Segments - No rounded caps for a sharp, clean look */}
          <path 
            d="M 10 50 A 40 40 0 0 1 21.72 21.72" 
            stroke={COLORS.poor} 
            strokeWidth={d.stroke} 
          />
          <path 
            d="M 21.72 21.72 A 40 40 0 0 1 50 10" 
            stroke={COLORS.avg} 
            strokeWidth={d.stroke} 
          />
          <path 
            d="M 50 10 A 40 40 0 0 1 78.28 21.72" 
            stroke={COLORS.good} 
            strokeWidth={d.stroke} 
          />
          <path 
            d="M 78.28 21.72 A 40 40 0 0 1 90 50" 
            stroke={COLORS.excellent} 
            strokeWidth={d.stroke} 
          />

          {/* Center Score and Text */}
          <text 
            x="50" 
            y="42" 
            textAnchor="middle" 
            className="fill-slate-900 font-black"
            style={{ fontSize: '16px' }}
          >
            {numericScore}
          </text>
          <text 
            x="50" 
            y="52" 
            textAnchor="middle" 
            className="fill-slate-400 font-bold uppercase tracking-widest"
            style={{ fontSize: '4px' }}
          >
            CIBIL SCORE
          </text>

          {/* Needle Base Circle - Smaller and more subtle */}
          <circle cx="50" cy="50" r="2.5" fill="#1e293b" />
          
          {/* Needle - Sleeker, thinner design */}
          <g transform={`rotate(${rotation - 90}, 50, 50)`}>
            <polygon 
              points="49.2,50 50.8,50 50,12" 
              fill="#0f172a" 
              className="transition-transform duration-1000 ease-out"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="-90"
                to="0"
                dur="1.2s"
                fill="freeze"
              />
            </polygon>
          </g>
        </svg>
      </div>

      {showLabels && (
        <div className="grid grid-cols-4 w-full mt-4 text-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black tracking-wider text-red-500 uppercase">Poor</span>
            <span className="text-[10px] font-bold text-slate-400">300-550</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black tracking-wider text-orange-500 uppercase">Average</span>
            <span className="text-[10px] font-bold text-slate-400">550-650</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black tracking-wider text-lime-600 uppercase">Good</span>
            <span className="text-[10px] font-bold text-slate-400">650-750</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase">Excellent</span>
            <span className="text-[10px] font-bold text-slate-400">750-900</span>
          </div>
        </div>
      )}
    </div>
  );
};

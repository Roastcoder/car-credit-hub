import React from 'react';
import { IndianRupee, CheckCircle2, Clock, MapPin, Building2, UserPlus, MessagesSquare, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// A mapping of icon names from JSON to Lucide React components
const IconMap: Record<string, React.ElementType> = {
  IndianRupee, CheckCircle2, Clock, MapPin, Building2, UserPlus, MessagesSquare, Activity
};

const resolveData = (value: any, context: any) => {
  if (typeof value === 'string' && value.startsWith('ctx.')) {
    const key = value.split('.')[1];
    return context[key] || value;
  }
  return value;
};

// 1. Container Component
const Container = ({ children, className, style }: any) => (
  <div className={className} style={style}>{children}</div>
);

// 2. StatCard Component (Dynamic Dashboard KPI)
const StatCard = ({ title, value, sub, iconName, color, trendData, className, onClick, context }: any) => {
  const Icon = iconName && IconMap[iconName] ? IconMap[iconName] : null;
  const resolvedValue = resolveData(value, context);
  const resolvedSub = resolveData(sub, context);
  const resolvedTrendData = resolveData(trendData, context);

  return (
    <div 
      className={`stat-card transition-all hover:shadow-lg hover:border-accent/40 cursor-pointer ${className || ''}`}
      onClick={onClick}
      style={{ borderLeftWidth: color ? '4px' : '0', borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} style={{ color }} />}
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">{title}</p>
        </div>
        {resolvedTrendData && resolvedTrendData.length > 1 && (
          <div className="h-6 w-12 hidden sm:block">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resolvedTrendData}>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color || '#3b82f6'} 
                  fill={color || '#3b82f6'} 
                  fillOpacity={0.1} 
                  strokeWidth={1.5} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-blue-950 dark:text-white">{resolvedValue}</p>
      <p className="text-xs text-muted-foreground mt-1">{resolvedSub}</p>
    </div>
  );
};

// 3. Grid Component
const Grid = ({ children, columns, gap, className }: any) => {
  const colsClass = columns ? `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}` : 'grid-cols-1';
  return (
    <div className={`grid ${colsClass} gap-${gap || 4} ${className || ''}`}>
      {children}
    </div>
  );
};

// 4. Text Component
const Text = ({ text, context, className, variant = 'p' }: any) => {
  const Tag = variant as keyof JSX.IntrinsicElements;
  const resolvedText = resolveData(text, context);
  return <Tag className={className}>{resolvedText}</Tag>;
};

// The central registry mapper
export const SDUIRegistry: Record<string, React.FC<any>> = {
  Container,
  StatCard,
  Grid,
  Text,
};

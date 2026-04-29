import React from 'react';
import VehicleImage from './VehicleImage';
import { Fuel, Calendar, Shield, Hash, Fingerprint, Settings, User as UserIcon, Activity, Map, Layout, Zap, IndianRupee } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface VehicleDetailsCardProps {
  vehicleData: {
    registration_number?: string;
    make?: string;
    model?: string;
    variant?: string;
    fuel_type?: string;
    manufacturing_year?: string;
    owner_name?: string;
    insurance_expiry?: string;
    registration_date?: string;
    chassis_number?: string;
    engine_number?: string;
    vehicle_class?: string;
    status?: string;
    vertical?: string;
    scheme?: string;
    on_road_price?: string | number;
    ltv?: string | number;
    m_parivahan?: string;
  };
  className?: string;
}

const VehicleDetailsCard: React.FC<VehicleDetailsCardProps> = ({ vehicleData, className }) => {
  const {
    registration_number,
    make = 'Unknown',
    model = 'Unknown',
    variant = '',
    fuel_type,
    manufacturing_year,
    owner_name,
    insurance_expiry,
    chassis_number,
    engine_number,
    vehicle_class,
    status,
    vertical,
    scheme,
    on_road_price,
    ltv,
    m_parivahan
  } = vehicleData;

  const mainFields = [
    { label: 'Registration', value: registration_number, icon: <Hash size={14} className="text-blue-500" /> },
    { label: 'Fuel Type', value: fuel_type, icon: <Fuel size={14} className="text-orange-500" /> },
    { label: 'Mfg Year', value: manufacturing_year, icon: <Calendar size={14} className="text-purple-500" /> },
    { label: 'Insurance Expiry', value: formatDate(insurance_expiry), icon: <Shield size={14} className="text-emerald-500" /> },
  ];

  const secondaryFields = [
    { label: 'Vertical', value: vertical, icon: <Layout size={12} className="text-pink-500" /> },
    { label: 'Scheme', value: scheme, icon: <Zap size={12} className="text-yellow-500" /> },
    { label: 'LTV (%)', value: ltv ? `${ltv}%` : null, icon: <Activity size={12} className="text-blue-500" /> },
  ].filter(f => f.value && f.value !== '—');

  return (
    <div className={cn("bg-gradient-to-br from-card to-muted/30 border border-border rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 group/card w-full", className)}>
      <div className="flex flex-col md:flex-row h-full min-h-[400px]">
        
        {/* Left Section: Image (Hero Style) */}
        <div className="w-full md:w-[35%] lg:w-[40%] relative min-h-[300px] md:min-h-full overflow-hidden bg-muted/40">
          <div className="absolute top-6 left-6 z-10">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border backdrop-blur-xl",
              status?.toLowerCase() === 'active' 
                ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" 
                : "bg-orange-500/20 text-orange-600 border-orange-500/30"
            )}>
              {status || 'Verified'}
            </span>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
             <VehicleImage 
              make={make} 
              model={model} 
              variant={variant} 
              className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] group-hover/card:scale-110 transition-transform duration-1000"
            />
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Right Section: Detailed Info */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-between bg-card">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
                <UserIcon size={16} className="text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] leading-none mb-1">Vehicle Owner</span>
                <span className="text-xs font-bold text-foreground uppercase">{owner_name || 'System Records'}</span>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-4xl lg:text-5xl font-black text-foreground uppercase tracking-tighter leading-[0.9] mb-2 group-hover/card:text-accent transition-colors duration-500">
                {make} <br />
                <span className="text-muted-foreground/40">{model}</span>
              </h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-50 border-l-2 border-accent/30 pl-4 mt-4">
                {variant || 'Standard Variant'}
              </p>
            </div>

            {/* Primary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
              {mainFields.map((field, idx) => (
                <div key={idx} className="flex flex-col gap-2 group/item">
                  <div className="flex items-center gap-2 text-muted-foreground/40 transition-colors group-hover/item:text-accent/60">
                    {field.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{field.label}</span>
                  </div>
                  <p className="text-base font-bold text-foreground uppercase tracking-tight">
                    {field.value || '—'}
                  </p>
                </div>
              ))}
            </div>

            {/* Secondary Strip */}
            {secondaryFields.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-8 py-6 border-y border-border/40">
                {secondaryFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 border border-border/50">{field.icon}</div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">{field.label}</span>
                      <span className="text-sm font-bold text-foreground uppercase">{field.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Info & Footer */}
          <div className="mt-10 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-4">
              {chassis_number && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/40">
                  <Fingerprint size={12} className="text-muted-foreground/40" />
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{chassis_number}</span>
                </div>
              )}
              {engine_number && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/40">
                  <Settings size={12} className="text-muted-foreground/40" />
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{engine_number}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
              <div className="flex -space-x-1">
                {[1, 2].map(i => (
                  <div key={i} className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Shield size={8} className="text-emerald-600" />
                  </div>
                ))}
              </div>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                Verified via Surepass
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsCard;

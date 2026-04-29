import React from 'react';
import VehicleImage from './VehicleImage';
import { Fuel, Calendar, Shield, Hash, Fingerprint, Settings, User as UserIcon, Activity } from 'lucide-react';
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
    status
  } = vehicleData;

  const mainFields = [
    { label: 'Registration', value: registration_number, icon: <Hash size={14} className="text-blue-500" /> },
    { label: 'Fuel Type', value: fuel_type, icon: <Fuel size={14} className="text-orange-500" /> },
    { label: 'Mfg Year', value: manufacturing_year, icon: <Calendar size={14} className="text-purple-500" /> },
    { label: 'Insurance Expiry', value: formatDate(insurance_expiry), icon: <Shield size={14} className="text-emerald-500" /> },
  ];

  const technicalFields = [
    { label: 'Chassis Number', value: chassis_number, icon: <Fingerprint size={12} /> },
    { label: 'Engine Number', value: engine_number, icon: <Settings size={12} /> },
    { label: 'Vehicle Class', value: vehicle_class, icon: <Activity size={12} /> },
    { label: 'RC Status', value: status, icon: <Shield size={12} /> },
  ].filter(f => f.value && f.value !== '—' && f.value !== 'N/A');

  return (
    <div className={cn("bg-gradient-to-br from-card to-muted/30 border border-border rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group/card", className)}>
      <div className="flex flex-col lg:flex-row">
        {/* Visual Section */}
        <div className="w-full lg:w-2/5 p-6 relative">
          <div className="absolute top-8 left-8 z-10">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border backdrop-blur-md",
              status?.toLowerCase() === 'active' 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-orange-500/10 text-orange-600 border-orange-500/20"
            )}>
              {status || 'Verified'}
            </span>
          </div>
          
          <VehicleImage 
            make={make} 
            model={model} 
            variant={variant} 
            className="aspect-[4/3] w-full shadow-2xl ring-1 ring-border/50 group-hover/card:scale-[1.02] transition-transform duration-700"
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
                  <UserIcon size={14} className="text-accent" />
                </div>
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  {owner_name || 'System Records'}
                </span>
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight leading-none mb-1 group-hover/card:text-accent transition-colors">
              {make} <span className="opacity-70">{model}</span>
            </h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
              {variant || 'Standard Variant'}
            </p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-8">
              {mainFields.map((field, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 group/item">
                  <div className="flex items-center gap-2 text-muted-foreground/50 transition-colors group-hover/item:text-foreground/70">
                    {field.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{field.label}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground uppercase tracking-tight">
                    {field.value || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Grid - Conditional */}
          {technicalFields.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {technicalFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="text-muted-foreground/40">{field.icon}</div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">{field.label}</span>
                    <span className="text-[10px] font-bold text-foreground truncate max-w-[140px] uppercase">{field.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-card bg-accent/20 flex items-center justify-center">
                  <Shield size={8} className="text-accent" />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
              Data Verified via Surepass API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsCard;

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
    status,
    vertical,
    scheme,
    ltv,
  } = vehicleData;

  const fields = [
    { label: 'Reg', value: registration_number, icon: <Hash size={10} className="text-blue-500" /> },
    { label: 'Fuel', value: fuel_type, icon: <Fuel size={10} className="text-orange-500" /> },
    { label: 'Mfg', value: manufacturing_year, icon: <Calendar size={10} className="text-purple-500" /> },
    { label: 'Exp', value: formatDate(insurance_expiry), icon: <Shield size={10} className="text-emerald-500" /> },
    { label: 'Vert', value: vertical, icon: <Layout size={10} className="text-pink-500" /> },
    { label: 'Sch', value: scheme, icon: <Zap size={10} className="text-yellow-500" /> },
    { label: 'LTV', value: ltv ? `${ltv}%` : null, icon: <Activity size={10} className="text-blue-500" /> },
    { label: 'Stat', value: status, icon: <Shield size={10} className="text-emerald-500" /> },
  ].filter(f => f.value && f.value !== '—' && f.value !== 'N/A');

  return (
    <div className={cn("bg-card border border-border rounded-3xl overflow-hidden shadow-lg transition-all duration-300 max-w-full", className)}>
      <div className="flex flex-col">
        {/* Top: Compact Image */}
        <div className="relative h-40 overflow-hidden bg-muted/20">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
          
          <div className="absolute top-3 left-3 z-20 flex gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md",
              status?.toLowerCase() === 'active' 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-orange-500/20 text-orange-400 border-orange-500/30"
            )}>
              {status || 'Verified'}
            </span>
          </div>

          <div className="absolute bottom-3 left-4 z-20">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
              {make} <span className="text-white/60">{model}</span>
            </h2>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">
              {owner_name || 'System Records'}
            </p>
          </div>
          
          <VehicleImage 
            make={make} 
            model={model} 
            variant={variant} 
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
          />
        </div>

        {/* Bottom: Compact Dense Grid */}
        <div className="p-4 bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fields.map((field, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-1.5 opacity-40">
                  {field.icon}
                  <span className="text-[7px] font-black uppercase tracking-widest">{field.label}</span>
                </div>
                <p className="text-[10px] font-bold text-foreground uppercase truncate">
                  {field.value || '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Technical - Even more compact */}
          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-muted/30 px-2 py-1 rounded-md">
              <div className="flex items-center gap-1.5 opacity-30">
                <Fingerprint size={8} />
                <span className="text-[7px] font-black uppercase">Chassis</span>
              </div>
              <span className="text-[9px] font-mono font-bold truncate max-w-[80px]">{chassis_number || '—'}</span>
            </div>
            <div className="flex items-center justify-between bg-muted/30 px-2 py-1 rounded-md">
              <div className="flex items-center gap-1.5 opacity-30">
                <Settings size={8} />
                <span className="text-[7px] font-black uppercase">Engine</span>
              </div>
              <span className="text-[9px] font-mono font-bold truncate max-w-[80px]">{engine_number || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsCard;

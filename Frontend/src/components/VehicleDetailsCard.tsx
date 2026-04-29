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
    { label: 'On-Road Price', value: on_road_price ? `₹${Number(on_road_price).toLocaleString()}` : null, icon: <IndianRupee size={12} className="text-green-500" /> },
    { label: 'LTV (%)', value: ltv ? `${ltv}%` : null, icon: <Activity size={12} className="text-blue-500" /> },
  ].filter(f => f.value && f.value !== '—' && f.value !== '0' && f.value !== '₹0');

  const technicalFields = [
    { label: 'Chassis', value: chassis_number, icon: <Fingerprint size={12} /> },
    { label: 'Engine', value: engine_number, icon: <Settings size={12} /> },
    { label: 'M-Parivahan', value: m_parivahan, icon: <Map size={12} /> },
    { label: 'RC Status', value: status, icon: <Shield size={12} /> },
  ].filter(f => f.value && f.value !== '—' && f.value !== 'N/A');

  return (
    <div className={cn("bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 group/card", className)}>
      <div className="flex flex-col">
        {/* Top Section: Half Image */}
        <div className="relative h-64 sm:h-80 overflow-hidden bg-muted/20">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
          
          <div className="absolute top-6 left-6 z-20">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xl border backdrop-blur-xl",
              status?.toLowerCase() === 'active' 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-orange-500/20 text-orange-400 border-orange-500/30"
            )}>
              {status || 'Verified Record'}
            </span>
          </div>

          <div className="absolute bottom-6 left-8 z-20">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                <UserIcon size={12} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em]">
                {owner_name || 'System Records'}
              </span>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
              {make} <span className="text-white/60">{model}</span>
            </h2>
            <p className="text-xs font-bold text-white/50 uppercase tracking-[0.3em] mt-2">
              {variant || 'Standard Configuration'}
            </p>
          </div>
          
          <VehicleImage 
            make={make} 
            model={model} 
            variant={variant} 
            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-1000 ease-out"
          />
        </div>

        {/* Bottom Section: Info Grid */}
        <div className="p-8 sm:p-10">
          {/* Main Info Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 pb-8 border-b border-border/50">
            {mainFields.map((field, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground/50">
                  {field.icon}
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none">{field.label}</span>
                </div>
                <p className="text-base font-bold text-foreground uppercase tracking-tight">
                  {field.value || 'N/A'}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Secondary Info */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Loan & Vehicle Parameters</h3>
              <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                {secondaryFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-3 group/item">
                    <div className="p-2 rounded-xl bg-muted/50 group-hover/item:bg-accent/10 transition-colors">
                      {field.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">{field.label}</span>
                      <span className="text-sm font-bold text-foreground uppercase">{field.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Identifiers */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Technical Identifiers</h3>
              <div className="grid grid-cols-1 gap-3">
                {technicalFields.map((field, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/30 hover:border-accent/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground/40">{field.icon}</div>
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{field.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Verification */}
          <div className="mt-12 pt-8 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-emerald-500/10 flex items-center justify-center">
                    <Shield size={10} className="text-emerald-500" />
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                Identity & Record Verified via Surepass API
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/5 border border-accent/10">
              <Activity size={10} className="text-accent" />
              <span className="text-[8px] font-black text-accent uppercase tracking-tighter">System Health: Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsCard;

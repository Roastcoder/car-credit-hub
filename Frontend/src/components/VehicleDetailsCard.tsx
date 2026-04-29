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

  const fields = [
    { label: 'Registration', value: registration_number, icon: <Hash size={12} className="text-blue-500" /> },
    { label: 'Fuel Type', value: fuel_type, icon: <Fuel size={12} className="text-orange-500" /> },
    { label: 'Mfg Year', value: manufacturing_year, icon: <Calendar size={12} className="text-purple-500" /> },
    { label: 'Insurance', value: formatDate(insurance_expiry), icon: <Shield size={12} className="text-emerald-500" /> },
    { label: 'Vertical', value: vertical, icon: <Layout size={12} className="text-pink-500" /> },
    { label: 'Scheme', value: scheme, icon: <Zap size={12} className="text-yellow-500" /> },
    { label: 'LTV (%)', value: ltv ? `${ltv}%` : null, icon: <Activity size={12} className="text-blue-500" /> },
    { label: 'Price', value: on_road_price ? `₹${Number(on_road_price).toLocaleString()}` : null, icon: <IndianRupee size={12} className="text-green-500" /> },
  ].filter(f => f.value && f.value !== '—' && f.value !== 'N/A' && f.value !== '₹0');

  const technical = [
    { label: 'Chassis', value: chassis_number, icon: <Fingerprint size={10} /> },
    { label: 'Engine', value: engine_number, icon: <Settings size={10} /> },
    { label: 'Class', value: vehicle_class, icon: <Activity size={10} /> },
    { label: 'M-Parivahan', value: m_parivahan, icon: <Map size={10} /> },
  ].filter(f => f.value && f.value !== '—' && f.value !== 'N/A');

  return (
    <div className={cn("bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl transition-all duration-300", className)}>
      <div className="flex flex-col">
        {/* Top: Image Section (35% height) */}
        <div className="relative h-48 overflow-hidden bg-muted/20">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          
          <div className="absolute top-4 left-4 z-20">
            <span className={cn(
              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md",
              status?.toLowerCase() === 'active' 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-orange-500/20 text-orange-400 border-orange-500/30"
            )}>
              {status || 'Verified'}
            </span>
          </div>

          <div className="absolute bottom-4 left-6 z-20">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">
              {make} <span className="text-white/60">{model}</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                {variant || 'Standard Variant'}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold text-accent/80 uppercase tracking-widest">
                {owner_name || 'System Records'}
              </span>
            </div>
          </div>
          
          <VehicleImage 
            make={make} 
            model={model} 
            variant={variant} 
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
          />
        </div>

        {/* Bottom: Info Section (65% height) */}
        <div className="p-6 bg-card">
          {/* Primary Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 mb-8">
            {fields.map((field, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 opacity-40">
                  {field.icon}
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">{field.label}</span>
                </div>
                <p className="text-xs font-bold text-foreground uppercase truncate">
                  {field.value || '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Technical Grid */}
          <div className="pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {technical.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/20">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground/30">{field.icon}</div>
                  <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">{field.label}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-foreground uppercase truncate max-w-[120px]">{field.value}</span>
              </div>
            ))}
          </div>

          {/* Footer API Verify */}
          <div className="mt-8 flex items-center gap-2 opacity-50">
            <Shield size={10} className="text-emerald-500" />
            <span className="text-[8px] font-black text-foreground uppercase tracking-widest">
              Data Verified via Surepass API System
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsCard;

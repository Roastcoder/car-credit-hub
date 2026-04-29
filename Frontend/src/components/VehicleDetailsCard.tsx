import React from 'react';
import VehicleImage from './VehicleImage';
import { IndianRupee, Fuel, Calendar, Shield, Hash, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    insurance_expiry
  } = vehicleData;

  const fields = [
    { label: 'Registration', value: registration_number, icon: <Hash size={14} /> },
    { label: 'Fuel Type', value: fuel_type, icon: <Fuel size={14} /> },
    { label: 'Mfg Year', value: manufacturing_year, icon: <Calendar size={14} /> },
    { label: 'Insurance Expiry', value: insurance_expiry, icon: <Shield size={14} /> },
  ];

  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300", className)}>
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="w-full md:w-2/5 p-4">
          <VehicleImage 
            make={make} 
            model={model} 
            variant={variant} 
            className="aspect-[4/3] w-full shadow-lg"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20">
                Vehicle Details
              </span>
              {owner_name && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[150px]">
                  Owner: {owner_name}
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight leading-tight">
              {make} <span className="text-accent">{model}</span>
            </h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {variant || 'Standard Variant'}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {fields.map((field, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    {field.icon}
                    <span className="text-[9px] font-black uppercase tracking-widest">{field.label}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground uppercase">
                    {field.value || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified RC Data</span>
            </div>
            <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">
              View RC Full →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsCard;

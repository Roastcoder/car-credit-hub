import React from 'react';
import { useVehicleImage } from '@/hooks/useVehicleImage';
import { Car, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleImageProps {
  make: string;
  model: string;
  variant?: string;
  className?: string;
}

const VehicleImage: React.FC<VehicleImageProps> = ({ make, model, variant, className }) => {
  const { data: imageUrl, isLoading, isError } = useVehicleImage(make, model, variant);

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  if (isLoading) {
    return (
      <div className={cn("bg-muted animate-pulse flex items-center justify-center rounded-xl", className)}>
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (isError || !imageUrl) {
    return (
      <div className={cn("bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center rounded-xl gap-2", className)}>
        <Car className="w-12 h-12 text-muted-foreground/30" />
        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Image Not Available</span>
      </div>
    );
  }

  // Determine if it's a relative path from our backend or an external URL
  const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-card border border-border group", className)}>
      <img 
        src={fullUrl} 
        alt={`${make} ${model}`} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
        <p className="text-white text-xs font-bold uppercase tracking-widest">
          {make} {model} {variant}
        </p>
      </div>
    </div>
  );
};

export default VehicleImage;

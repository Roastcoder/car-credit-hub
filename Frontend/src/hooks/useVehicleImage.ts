import { useQuery } from '@tanstack/react-query';
import { vehiclesAPI } from '@/lib/api';

export const useVehicleImage = (make: string, model: string, variant?: string) => {
  return useQuery({
    queryKey: ['vehicle-image', make, model, variant],
    queryFn: async () => {
      if (!make || !model) return null;
      try {
        const response = await vehiclesAPI.getImage({ make, model, variant });
        return response.url;
      } catch (error) {
        console.error('Failed to fetch vehicle image:', error);
        return null;
      }
    },
    enabled: !!make && !!model,
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    retry: 1
  });
};

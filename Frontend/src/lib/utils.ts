import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Use VITE_API_URL to get the base domain for local uploads
  // If API_URL is http://localhost:5000/api, we want http://localhost:5000
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.split('/api')[0];
  
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateEMI(principal: number, rate: number, tenureMonths: number, mode: string = 'Monthly'): number {
  let periodsPerYear = 12;
  let monthsPerPeriod = 1;

  if (mode === 'Quarterly') {
    periodsPerYear = 4;
    monthsPerPeriod = 3;
  } else if (mode === 'Half Yearly') {
    periodsPerYear = 2;
    monthsPerPeriod = 6;
  } else if (mode === 'Yearly') {
    periodsPerYear = 1;
    monthsPerPeriod = 12;
  }

  const periodicRate = rate / periodsPerYear / 100;
  const numberOfPeriods = tenureMonths / monthsPerPeriod;

  if (periodicRate === 0) return Math.round(principal / numberOfPeriods);

  return Math.round(
    (principal * periodicRate * Math.pow(1 + periodicRate, numberOfPeriods)) /
      (Math.pow(1 + periodicRate, numberOfPeriods) - 1),
  );
}

export function normalizeLoanNumberVertical(vertical?: string | null): string | null {
  if (!vertical) return null;

  const normalized = String(vertical).trim().toUpperCase();
  const verticalMap: Record<string, string> = {
    CAR: 'CAR',
    LCV: 'LCV',
    HCV: 'HCV',
    TRACTOR: 'TRACTOR',
    CE: 'CE',
  };

  return verticalMap[normalized] || null;
}

export function generateLoanNumber(vertical: string, lastLoanNumber?: string): string {
  const normalizedVertical = normalizeLoanNumberVertical(vertical);
  const prefix = normalizedVertical ? `MEH${normalizedVertical}` : 'MEH';
  
  if (!lastLoanNumber) {
    return `${prefix}0001`;
  }
  
  // Extract number from last loan number (e.g., MEHCAR0123 -> 123)
  const match = lastLoanNumber.match(new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`));
  if (!match) {
    return `${prefix}0001`;
  }
  
  const lastNumber = parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;
  
  // Pad with zeros to maintain 4-digit format
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

export function formatDate(value: unknown): string {
  if (!value) return '—';
  
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/');
}

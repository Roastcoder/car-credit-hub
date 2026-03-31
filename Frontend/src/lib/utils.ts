import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateEMI(principal: number, rate: number, tenure: number): number {
  const monthlyRate = rate / 12 / 100;
  if (monthlyRate === 0) return principal / tenure;
  return Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1),
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

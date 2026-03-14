export interface Scheme {
  type: string;
  name: string;
  financier: string;
  vertical: string;
  minVolume: number;
  maxVolume: number;
  tenureEmi: number;
  commissionRate: number;
  status: string;
}

export const SCHEMES: Scheme[] = [
  { type: 'Schemes 1', name: 'SK Car Silver Scheme', financier: 'SK Finance', vertical: 'CAR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 0, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Car Silver Scheme', financier: 'Kogta Financial', vertical: 'CAR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 19, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Car Gold Scheme', financier: 'Kogta Financial', vertical: 'CAR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 19, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Car Diamond Scheme', financier: 'Kogta Financial', vertical: 'CAR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 19, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Car Platinum Scheme', financier: 'Kogta Financial', vertical: 'CAR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 19, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta CV Silver Scheme', financier: 'Kogta Financial', vertical: 'CV', minVolume: 100000, maxVolume: 1099999, tenureEmi: 19, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta CV Gold Scheme', financier: 'Kogta Financial', vertical: 'CV', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 19, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta CV Diamond Scheme', financier: 'Kogta Financial', vertical: 'CV', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 19, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Car Gold Scheme', financier: 'SK Finance', vertical: 'CAR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Car Diamond Scheme', financier: 'SK Finance', vertical: 'CAR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CV Silver scheme', financier: 'SK Finance', vertical: 'CV', minVolume: 100000, maxVolume: 1099999, tenureEmi: 0, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CV Gold Scheme', financier: 'SK Finance', vertical: 'CV', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CV Diamond Scheme', financier: 'SK Finance', vertical: 'CV', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CV Platinum Scheme', financier: 'SK Finance', vertical: 'CV', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Tractor Silver Scheme', financier: 'SK Finance', vertical: 'TR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 0, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Tractor Gold Scheme', financier: 'SK Finance', vertical: 'TR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Tractor Diamond Scheme', financier: 'SK Finance', vertical: 'TR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Tractor Platinum Scheme', financier: 'SK Finance', vertical: 'TR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CE Silver Scheme', financier: 'SK Finance', vertical: 'CE', minVolume: 100000, maxVolume: 1099999, tenureEmi: 0, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CE Gold Scheme', financier: 'SK Finance', vertical: 'CE', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CE Diamond Scheme', financier: 'SK Finance', vertical: 'CE', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CE Platinum Scheme', financier: 'SK Finance', vertical: 'CE', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Car Platinum Scheme', financier: 'SK Finance', vertical: 'CAR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta CV Platinum Scheme', financier: 'Kogta Financial', vertical: 'CV', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 19, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Tractor Silver Scheme', financier: 'Kogta Financial', vertical: 'TR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 19, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Tractor Gold Scheme', financier: 'Kogta Financial', vertical: 'TR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 19, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Tractor Diamond Scheme', financier: 'Kogta Financial', vertical: 'TR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 19, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Tractor Diamond Scheme', financier: 'Kogta Financial', vertical: 'TR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 19, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta CE Scheme', financier: 'Kogta Financial', vertical: 'CE', minVolume: 100000, maxVolume: 9999999, tenureEmi: 19, commissionRate: 0.50, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Car Silver Scheme', financier: 'AU Small Finance Bank', vertical: 'CAR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 25, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Car Gold Scheme', financier: 'AU Small Finance Bank', vertical: 'CAR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 25, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Car Diamond Scheme', financier: 'AU Small Finance Bank', vertical: 'CAR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 25, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Car Platinum Scheme', financier: 'AU Small Finance Bank', vertical: 'CAR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 25, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 3', name: 'AU CV Silver Scheme', financier: 'AU Small Finance Bank', vertical: 'CV', minVolume: 100000, maxVolume: 1099999, tenureEmi: 25, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 3', name: 'AU CV Gold Scheme', financier: 'AU Small Finance Bank', vertical: 'CV', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 25, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 3', name: 'AU CV Diamond Scheme', financier: 'AU Small Finance Bank', vertical: 'CV', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 25, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 3', name: 'AU CV Platinum Scheme', financier: 'AU Small Finance Bank', vertical: 'CV', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 25, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 3', name: 'AU CE Scheme', financier: 'AU Small Finance Bank', vertical: 'CE', minVolume: 100000, maxVolume: 9999999, tenureEmi: 25, commissionRate: 0.50, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Tractor Silver Scheme', financier: 'AU Small Finance Bank', vertical: 'TR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 25, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Tractor Gold Scheme', financier: 'AU Small Finance Bank', vertical: 'TR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 25, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Tractor Diamond Scheme', financier: 'AU Small Finance Bank', vertical: 'TR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 25, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Tractor Platinum Scheme', financier: 'AU Small Finance Bank', vertical: 'TR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 25, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Car Silver Scheme', financier: 'Cholamandalam Investment', vertical: 'CAR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 0, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Car Gold Scheme', financier: 'Cholamandalam Investment', vertical: 'CAR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Car Diamond Scheme', financier: 'Cholamandalam Investment', vertical: 'CAR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Car Platinum Scheme', financier: 'Cholamandalam Investment', vertical: 'CAR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA CV Silver Scheme', financier: 'Cholamandalam Investment', vertical: 'CV', minVolume: 100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 1.5, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA CV Gold Scheme', financier: 'Cholamandalam Investment', vertical: 'CV', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA CV Diamond Scheme', financier: 'Cholamandalam Investment', vertical: 'CV', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 0, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA CV Platinum Scheme', financier: 'Cholamandalam Investment', vertical: 'CV', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA HCV Scheme', financier: 'Cholamandalam Investment', vertical: 'HCV', minVolume: 100000, maxVolume: 1099999, tenureEmi: 0, commissionRate: 0.75, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA CE Scheme', financier: 'Cholamandalam Investment', vertical: 'CE', minVolume: 100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 0.50, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Tractor Silver Scheme', financier: 'Cholamandalam Investment', vertical: 'TR', minVolume: 100000, maxVolume: 1099999, tenureEmi: 0, commissionRate: 1.75, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Tractor Gold Scheme', financier: 'Cholamandalam Investment', vertical: 'TR', minVolume: 1100000, maxVolume: 2099999, tenureEmi: 0, commissionRate: 2, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Tractor Diamond Scheme', financier: 'Cholamandalam Investment', vertical: 'TR', minVolume: 2100000, maxVolume: 5099999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Tractor Platinum Scheme', financier: 'Cholamandalam Investment', vertical: 'TR', minVolume: 5100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 5', name: 'Kamal Scheme', financier: 'Kamal Finserve', vertical: 'CV', minVolume: 100000, maxVolume: 9999999, tenureEmi: 0, commissionRate: 1.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Car Platinum Scheme', financier: 'Kogta Financial', vertical: 'CAR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 19, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CV Platinum Scheme', financier: 'SK Finance', vertical: 'CV', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Tractor Platinum Scheme', financier: 'SK Finance', vertical: 'TR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 1', name: 'SK CE Platinum Scheme', financier: 'SK Finance', vertical: 'CE', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 1', name: 'SK Car Platinum Scheme', financier: 'SK Finance', vertical: 'CAR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta CV Platinum Scheme', financier: 'Kogta Financial', vertical: 'CV', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 19, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta Tractor Diamond Scheme', financier: 'Kogta Financial', vertical: 'TR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 19, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 2', name: 'Kogta CE Scheme', financier: 'Kogta Financial', vertical: 'CE', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 19, commissionRate: 0.50, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Car Platinum Scheme', financier: 'AU Small Finance Bank', vertical: 'CAR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 25, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 3', name: 'AU CV Platinum Scheme', financier: 'AU Small Finance Bank', vertical: 'CV', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 25, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 3', name: 'AU CE Scheme', financier: 'AU Small Finance Bank', vertical: 'CE', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 25, commissionRate: 0.50, status: 'Active' },
  { type: 'Schemes 3', name: 'AU Tractor Platinum Scheme', financier: 'AU Small Finance Bank', vertical: 'TR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 25, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Car Platinum Scheme', financier: 'Cholamandalam Investment', vertical: 'CAR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 2.5, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA CV Platinum Scheme', financier: 'Cholamandalam Investment', vertical: 'CV', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA HCV Scheme', financier: 'Cholamandalam Investment', vertical: 'HCV', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 0.75, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA CE Scheme', financier: 'Cholamandalam Investment', vertical: 'CE', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 0.50, status: 'Active' },
  { type: 'Schemes 4', name: 'CHOLA Tractor Platinum Scheme', financier: 'Cholamandalam Investment', vertical: 'TR', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 2.25, status: 'Active' },
  { type: 'Schemes 5', name: 'Kamal Scheme', financier: 'Kamal Finserve', vertical: 'CV', minVolume: 10000000, maxVolume: 99999999, tenureEmi: 0, commissionRate: 1.5, status: 'Active' },
];

export function calculateCommission(
  financierName: string,
  vertical: string,
  loanAmount: number,
  tenure: number
): { rate: number; amount: number; schemeMatched?: Scheme } {
  // Try to find the matching scheme based on rules
  const matchingScheme = SCHEMES.find((s) => {
    // Basic match on name/vertical
    // Make matching case-insensitive and partial if needed, but the predefined matrix uses exact names largely
    const isFinancierMatch = s.financier.toLowerCase() === financierName.toLowerCase();
    
    // For vertical, check if it partially matches e.g. "PV (Car)" -> "CAR"
    const isVerticalMatch = vertical && s.vertical && vertical.toLowerCase().includes(s.vertical.toLowerCase()) || 
              (s.vertical.toLowerCase() === 'car' && vertical.toLowerCase().includes('pv'));
              
    const isVolumeMatch = loanAmount >= s.minVolume && loanAmount <= s.maxVolume;
    
    // Tenure EMI applies mostly if it's strictly requiring > tenureEmi. The matrix has 0, 19, 25.
    // If tenure is e.g. 24, and scheme requires 25, it might not match.
    // We treat tenureEmi as the minimum tenure required for that scheme.
    const isTenureMatch = tenure >= s.tenureEmi;
    
    return isFinancierMatch && isVerticalMatch && isVolumeMatch && isTenureMatch;
  });

  if (matchingScheme) {
    const amount = (loanAmount * matchingScheme.commissionRate) / 100;
    return {
      rate: matchingScheme.commissionRate,
      amount: amount,
      schemeMatched: matchingScheme,
    };
  }

  // Fallback to 0 if no scheme matches
  return { rate: 0, amount: 0 };
}

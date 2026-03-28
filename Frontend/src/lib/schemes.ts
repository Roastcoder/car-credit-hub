export interface TenureRule {
  minTenure: number;
  maxTenure: number;
  payoutMultiplier: number; // 0 = zero payout, 0.5 = half payout, 1 = full payout
  description: string;
}

export interface AdvancedScheme {
  type: string;
  name: string;
  financier: string;
  vertical: string;
  minVolume: number;
  maxVolume: number;
  baseCommissionRate: number;
  tenureRules: TenureRule[];
  status: string;
}

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

// Advanced schemes with tenure-based payout rules
export const ADVANCED_SCHEMES: AdvancedScheme[] = [
  // AU Small Finance Bank schemes
  {
    type: 'Advanced AU Scheme',
    name: 'AU Small Finance Bank - Used Car',
    financier: 'AU Small Finance Bank',
    vertical: 'Car',
    minVolume: 100000,
    maxVolume: 500000,
    baseCommissionRate: 1.50,
    tenureRules: [
      { minTenure: 1, maxTenure: 18, payoutMultiplier: 0, description: '18 months or below - Zero payout' },
      { minTenure: 19, maxTenure: 24, payoutMultiplier: 0.5, description: '19-24 months - Half payout' },
      { minTenure: 25, maxTenure: 120, payoutMultiplier: 1, description: '25+ months - Full payout' }
    ],
    status: 'Active'
  },
  {
    type: 'Advanced AU Scheme',
    name: 'AU Small Finance Bank - Used Car Gold',
    financier: 'AU Small Finance Bank',
    vertical: 'Car',
    minVolume: 500001,
    maxVolume: 1000000,
    baseCommissionRate: 1.75,
    tenureRules: [
      { minTenure: 1, maxTenure: 18, payoutMultiplier: 0, description: '18 months or below - Zero payout' },
      { minTenure: 19, maxTenure: 24, payoutMultiplier: 0.5, description: '19-24 months - Half payout' },
      { minTenure: 25, maxTenure: 120, payoutMultiplier: 1, description: '25+ months - Full payout' }
    ],
    status: 'Active'
  },
  {
    type: 'Advanced AU Scheme',
    name: 'AU Small Finance Bank - Used Car Premium',
    financier: 'AU Small Finance Bank',
    vertical: 'Car',
    minVolume: 1000001,
    maxVolume: 2500000,
    baseCommissionRate: 2.00,
    tenureRules: [
      { minTenure: 1, maxTenure: 18, payoutMultiplier: 0, description: '18 months or below - Zero payout' },
      { minTenure: 19, maxTenure: 24, payoutMultiplier: 0.5, description: '19-24 months - Half payout' },
      { minTenure: 25, maxTenure: 120, payoutMultiplier: 1, description: '25+ months - Full payout' }
    ],
    status: 'Active'
  },
  
  // SK Finance schemes - No tenure restrictions (NA)
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used Vehicles Tier 1',
    financier: 'SK Finance',
    vertical: 'Used Car',
    minVolume: 0,
    maxVolume: 500000,
    baseCommissionRate: 2.00,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CV Tier 1',
    financier: 'SK Finance',
    vertical: 'Used CV',
    minVolume: 0,
    maxVolume: 500000,
    baseCommissionRate: 2.00,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CE Tier 1',
    financier: 'SK Finance',
    vertical: 'Used CE',
    minVolume: 0,
    maxVolume: 500000,
    baseCommissionRate: 2.00,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  
  // SK Finance Tier 2: 6-10 Lac
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used Vehicles Tier 2',
    financier: 'SK Finance',
    vertical: 'Used Car',
    minVolume: 600000,
    maxVolume: 1000000,
    baseCommissionRate: 2.25,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CV Tier 2',
    financier: 'SK Finance',
    vertical: 'Used CV',
    minVolume: 600000,
    maxVolume: 1000000,
    baseCommissionRate: 2.25,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CE Tier 2',
    financier: 'SK Finance',
    vertical: 'Used CE',
    minVolume: 600000,
    maxVolume: 1000000,
    baseCommissionRate: 2.25,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  
  // SK Finance Tier 3: 11-50 Lac
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used Vehicles Tier 3',
    financier: 'SK Finance',
    vertical: 'Used Car',
    minVolume: 1100000,
    maxVolume: 5000000,
    baseCommissionRate: 2.50,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CV Tier 3',
    financier: 'SK Finance',
    vertical: 'Used CV',
    minVolume: 1100000,
    maxVolume: 5000000,
    baseCommissionRate: 2.50,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CE Tier 3',
    financier: 'SK Finance',
    vertical: 'Used CE',
    minVolume: 1100000,
    maxVolume: 5000000,
    baseCommissionRate: 2.50,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  
  // SK Finance Tier 4: 51 Lac and above
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used Vehicles Tier 4',
    financier: 'SK Finance',
    vertical: 'Used Car',
    minVolume: 5100000,
    maxVolume: 99999999,
    baseCommissionRate: 2.75,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CV Tier 4',
    financier: 'SK Finance',
    vertical: 'Used CV',
    minVolume: 5100000,
    maxVolume: 99999999,
    baseCommissionRate: 2.75,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  },
  {
    type: 'SK Finance Scheme',
    name: 'SK Finance - Used CE Tier 4',
    financier: 'SK Finance',
    vertical: 'Used CE',
    minVolume: 5100000,
    maxVolume: 99999999,
    baseCommissionRate: 2.75,
    tenureRules: [
      { minTenure: 1, maxTenure: 120, payoutMultiplier: 1, description: 'All tenures - Full payout (No tenure restriction)' }
    ],
    status: 'Active'
  }
];

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

export function calculateAdvancedCommission(
  financierName: string,
  vertical: string,
  loanAmount: number,
  tenure: number
): { 
  rate: number; 
  amount: number; 
  schemeMatched?: AdvancedScheme; 
  tenureRule?: TenureRule; 
  payoutType?: string;
  calculationBreakdown?: {
    financier: string;
    tenure: number;
    vertical: string;
    businessVolume: number;
    volumeTier: string;
    baseRate: number;
    tenureMultiplier: number;
    finalRate: number;
  }
} {
  // First try advanced schemes with tenure rules
  const matchingAdvancedScheme = ADVANCED_SCHEMES.find((s) => {
    const isFinancierMatch = s.financier.toLowerCase().includes(financierName.toLowerCase()) || 
                            financierName.toLowerCase().includes(s.financier.toLowerCase());
    
    const v = vertical ? vertical.toLowerCase() : '';
    const sv = s.vertical ? s.vertical.toLowerCase() : '';
    
    // Enhanced vertical matching for SK Finance and other schemes
    const isVerticalMatch = v && sv && (
      v.includes(sv) || 
      sv.includes(v) ||
      // Car matching
      (sv.includes('car') && (v.includes('pv') || v.includes('car') || v.includes('used'))) ||
      // CV matching (Commercial Vehicle)
      (sv.includes('cv') && (v === 'lcv' || v === 'hcv' || v === 'cv' || v.includes('commercial'))) ||
      // CE matching (Construction Equipment)
      (sv.includes('ce') && (v === 'ce' || v.includes('construction') || v.includes('equipment'))) ||
      // Tractor matching
      (sv.includes('tr') && v.includes('tractor')) ||
      // HCV specific matching
      (sv === 'hcv' && v === 'hcv')
    );
    
    const isVolumeMatch = loanAmount >= s.minVolume && loanAmount <= s.maxVolume;
    
    return isFinancierMatch && isVerticalMatch && isVolumeMatch;
  });

  if (matchingAdvancedScheme) {
    // Find the applicable tenure rule
    const applicableTenureRule = matchingAdvancedScheme.tenureRules.find(rule => 
      tenure >= rule.minTenure && tenure <= rule.maxTenure
    );

    if (applicableTenureRule) {
      const effectiveRate = matchingAdvancedScheme.baseCommissionRate * applicableTenureRule.payoutMultiplier;
      const amount = (loanAmount * effectiveRate) / 100;
      
      let payoutType = 'Full Payout';
      if (applicableTenureRule.payoutMultiplier === 0) payoutType = 'Zero Payout';
      else if (applicableTenureRule.payoutMultiplier === 0.5) payoutType = 'Half Payout';
      
      // Determine volume tier description
      let volumeTier = '';
      if (loanAmount <= 500000) volumeTier = '0-5 Lac';
      else if (loanAmount <= 1000000) volumeTier = '6-10 Lac';
      else if (loanAmount <= 5000000) volumeTier = '11-50 Lac';
      else volumeTier = '51+ Lac';
      
      return {
        rate: effectiveRate,
        amount: amount,
        schemeMatched: matchingAdvancedScheme,
        tenureRule: applicableTenureRule,
        payoutType: payoutType,
        calculationBreakdown: {
          financier: financierName,
          tenure: tenure,
          vertical: vertical,
          businessVolume: loanAmount,
          volumeTier: volumeTier,
          baseRate: matchingAdvancedScheme.baseCommissionRate,
          tenureMultiplier: applicableTenureRule.payoutMultiplier,
          finalRate: effectiveRate
        }
      };
    }
  }

  // Fallback to regular scheme calculation
  const fallbackResult = calculateCommission(financierName, vertical, loanAmount, tenure);
  
  // Add breakdown for fallback too
  if (fallbackResult.amount > 0) {
    let volumeTier = '';
    if (loanAmount <= 500000) volumeTier = '0-5 Lac';
    else if (loanAmount <= 1000000) volumeTier = '6-10 Lac';
    else if (loanAmount <= 5000000) volumeTier = '11-50 Lac';
    else volumeTier = '51+ Lac';
    
    return {
      ...fallbackResult,
      calculationBreakdown: {
        financier: financierName,
        tenure: tenure,
        vertical: vertical,
        businessVolume: loanAmount,
        volumeTier: volumeTier,
        baseRate: fallbackResult.rate,
        tenureMultiplier: 1,
        finalRate: fallbackResult.rate
      }
    };
  }
  
  return fallbackResult;
}

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
    
    // For vertical, check if it partially matches e.g. "PV (Car)" -> "CAR" or "Tractor" -> "TR"
    const v = vertical ? vertical.toLowerCase() : '';
    const sv = s.vertical ? s.vertical.toLowerCase() : '';
    
    const isVerticalMatch = v && sv && (
      v.includes(sv) || 
      (sv === 'car' && (v.includes('pv') || v.includes('car'))) ||
      (sv === 'tr' && v.includes('tractor')) ||
      (sv === 'cv' && (v === 'lcv' || v === 'hcv' || v === 'cv')) ||
      (sv === 'hcv' && v === 'hcv')
    );
    
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

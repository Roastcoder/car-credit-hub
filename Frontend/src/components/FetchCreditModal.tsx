import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CreditCard, Download, User as UserIcon, X, CheckCircle2 } from 'lucide-react';
import { externalAPI } from '@/lib/api';
import { CREDIT_SCORE_TYPES, GENDER_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FetchCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (report: any) => void;
  initialData?: {
    name?: string;
    mobile?: string;
    pan?: string;
    aadhaar?: string;
    loan_id?: string | number;
    lead_id?: string | number;
    gender?: string;
  };
}

export const FetchCreditModal: React.FC<FetchCreditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData 
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchForm, setFetchForm] = useState({
    provider: 'CIBIL',
    name: '',
    first_name: '',
    last_name: '',
    mobile: '',
    identifier_type: 'pan' as 'pan' | 'aadhaar',
    identifier_value: '',
    loan_id: '',
    lead_id: '',
    gender: 'male',
    consent: false
  });

  useEffect(() => {
    if (isOpen && initialData) {
      const names = (initialData.name || '').split(' ');
      setFetchForm(prev => ({
        ...prev,
        name: initialData.name || '',
        first_name: names[0] || '',
        last_name: names.slice(1).join(' ') || '',
        mobile: initialData.mobile || '',
        loan_id: initialData.loan_id?.toString() || '',
        lead_id: initialData.lead_id?.toString() || '',
        gender: (initialData.gender?.toLowerCase() === 'female' ? 'female' : 'male'),
        identifier_type: initialData.pan ? 'pan' : (initialData.aadhaar ? 'aadhaar' : 'pan'),
        identifier_value: initialData.pan || initialData.aadhaar || '',
        consent: false
      }));
    }
  }, [isOpen, initialData]);

  const handleFetchReport = async () => {
    // Validation
    if (!fetchForm.consent) {
      toast.error('Please confirm customer consent first');
      return;
    }

    if (fetchForm.provider === 'CRIF') {
      if (!fetchForm.first_name || !fetchForm.last_name || !fetchForm.mobile || !fetchForm.identifier_value) {
        toast.error('Please fill in all required fields for CRIF');
        return;
      }
    } else {
      if (!fetchForm.name || !fetchForm.mobile || !fetchForm.identifier_value) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    try {
      setIsFetching(true);
      
      const payload: any = {
        provider: fetchForm.provider.toUpperCase(),
        mobile: fetchForm.mobile,
        loan_id: fetchForm.loan_id || undefined,
        lead_id: fetchForm.lead_id || undefined,
        consent: 'Y'
      };

      // Provider-specific payload construction
      switch (fetchForm.provider.toUpperCase()) {
        case 'CRIF':
          payload.first_name = fetchForm.first_name;
          payload.last_name = fetchForm.last_name;
          payload.pan = fetchForm.identifier_value;
          payload.raw = false;
          break;
        case 'CIBIL':
          payload.name = fetchForm.name;
          payload.pan = fetchForm.identifier_value;
          payload.gender = fetchForm.gender.toLowerCase();
          break;
        case 'EXPERIAN':
          payload.name = fetchForm.name;
          payload.pan = fetchForm.identifier_value;
          break;
        case 'EQUIFAX':
          payload.name = fetchForm.name;
          payload.id_number = fetchForm.identifier_value;
          payload.id_type = fetchForm.identifier_type;
          // Equifax V2 also accepts mobile correctly
          break;
      }

      const result = await externalAPI.fetchCreditReport(payload);
      
      if (result.success) {
        toast.success(`Report fetched successfully! Score: ${result.data.credit_score}`);
        if (onSuccess) onSuccess(result.data);
        onClose();
      } else {
        toast.error(result.message || 'Failed to fetch report');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error fetching credit report');
    } finally {
      setIsFetching(false);
    }
  };

  const isCrif = fetchForm.provider.toUpperCase() === 'CRIF';
  const isCibil = fetchForm.provider.toUpperCase() === 'CIBIL';
  const isEquifax = fetchForm.provider.toUpperCase() === 'EQUIFAX';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-4">
              <div className="p-2.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/40 ring-4 ring-blue-500/20">
                <ShieldCheck className="text-white h-7 w-7" />
              </div>
              Bureau Insights
            </DialogTitle>
            <DialogDescription className="text-slate-300 font-medium text-base mt-2">
              Official credit analysis powered by <span className="text-blue-400 font-bold">{fetchForm.provider}</span>.
            </DialogDescription>
          </DialogHeader>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Top Row: Provider Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Select Bureau Provider</label>
            <div className="grid grid-cols-4 gap-2">
              {CREDIT_SCORE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setFetchForm({...fetchForm, provider: type})}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold border-2 transition-all duration-300 ${
                    fetchForm.provider === type 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Identity Fields */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Personal Details</label>
              
              {isCrif ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="First Name" 
                      className="rounded-2xl border-slate-200 h-11 px-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                      value={fetchForm.first_name}
                      onChange={(e) => setFetchForm({...fetchForm, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input 
                      placeholder="Last Name" 
                      className="rounded-2xl border-slate-200 h-11 px-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                      value={fetchForm.last_name}
                      onChange={(e) => setFetchForm({...fetchForm, last_name: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    placeholder="Full Name (KYC Matching)" 
                    className="rounded-2xl border-slate-200 h-11 pl-12 pr-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                    value={fetchForm.name}
                    onChange={(e) => setFetchForm({...fetchForm, name: e.target.value})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  placeholder="Mobile Number" 
                  maxLength={10}
                  className="rounded-2xl border-slate-200 h-11 px-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                  value={fetchForm.mobile}
                  onChange={(e) => setFetchForm({...fetchForm, mobile: e.target.value})}
                />
                <Select 
                  value={fetchForm.gender} 
                  onValueChange={(v) => setFetchForm({...fetchForm, gender: v})}
                >
                  <SelectTrigger className={`rounded-2xl border-slate-200 h-11 px-4 font-bold transition-all ${isCibil ? 'opacity-100 ring-2 ring-blue-500/20' : 'opacity-80'}`}>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 overflow-hidden shadow-xl">
                    <SelectItem value="male" className="py-3 font-bold">Male</SelectItem>
                    <SelectItem value="female" className="py-3 font-bold">Female</SelectItem>
                    <SelectItem value="other" className="py-3 font-bold">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Verification Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Verification ID</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  {['pan', 'aadhaar'].map((id) => (
                    <button 
                      key={id}
                      disabled={isCrif || isCibil || fetchForm.provider.toUpperCase() === 'EXPERIAN'}
                      onClick={() => setFetchForm({...fetchForm, identifier_type: id as any})}
                      className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all duration-300 ${
                        fetchForm.identifier_type === id 
                        ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200/50' 
                        : 'text-slate-400 opacity-60'
                      }`}
                    >
                      {id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Input 
                  placeholder={fetchForm.identifier_type === 'pan' ? "Enter 10-digit PAN (e.g. ABCDE1234F)" : "Enter 12-digit Aadhaar Number"} 
                  className={`rounded-2xl border-slate-200 h-14 px-6 font-mono text-xl font-black text-slate-800 placeholder:text-slate-300 placeholder:text-sm placeholder:font-sans focus:ring-4 focus:ring-blue-100 transition-all ${fetchForm.identifier_type === 'pan' ? 'tracking-[0.2em]' : 'tracking-widest'}`}
                  value={fetchForm.identifier_value}
                  onChange={(e) => setFetchForm({...fetchForm, identifier_value: e.target.value.toUpperCase()})}
                />
                {fetchForm.identifier_value.length >= (fetchForm.identifier_type === 'pan' ? 10 : 12) && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-green-500" />
                )}
              </div>
            </div>

            {/* Consent Section */}
            <div 
              className={`p-5 rounded-2xl border-2 transition-all duration-300 flex gap-4 cursor-pointer ${
                fetchForm.consent 
                ? 'bg-emerald-50 border-emerald-100 ring-4 ring-emerald-500/5' 
                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
              }`}
              onClick={() => setFetchForm({...fetchForm, consent: !fetchForm.consent})}
            >
              <Checkbox 
                id="consent" 
                checked={fetchForm.consent} 
                onCheckedChange={(checked) => setFetchForm({...fetchForm, consent: checked as boolean})}
                className="mt-1 border-2 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <div className="space-y-1">
                <label 
                  htmlFor="consent" 
                  className={`text-xs font-black uppercase tracking-tight cursor-pointer transition-colors ${fetchForm.consent ? 'text-emerald-700' : 'text-slate-600'}`}
                >
                  Verify Customer Consent
                </label>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  I confirm that the customer has provided explicit consent to pull their credit report and verify their details through authorized bureaus.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex flex-col gap-4">
          <Button 
            className="w-full rounded-2xl h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale" 
            onClick={handleFetchReport}
            disabled={isFetching || !fetchForm.consent}
          >
            {isFetching ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>Generating Report...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Download className="h-6 w-6" />
                <span>Authorize & Fetch History</span>
              </div>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-500" />
            256-bit Encrypted Transaction
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

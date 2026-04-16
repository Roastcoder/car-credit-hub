import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CreditCard, Download, User as UserIcon, X } from 'lucide-react';
import { externalAPI } from '@/lib/api';
import { CREDIT_SCORE_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
    mobile: '',
    identifier_type: 'pan',
    identifier_value: '',
    loan_id: '',
    lead_id: '',
    gender: 'male'
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFetchForm(prev => ({
        ...prev,
        name: initialData.name || '',
        mobile: initialData.mobile || '',
        loan_id: initialData.loan_id?.toString() || '',
        lead_id: initialData.lead_id?.toString() || '',
        gender: (initialData.gender?.toLowerCase() === 'female' ? 'female' : 'male'),
        identifier_type: initialData.pan ? 'pan' : (initialData.aadhaar ? 'aadhaar' : 'pan'),
        identifier_value: initialData.pan || initialData.aadhaar || ''
      }));
    }
  }, [isOpen, initialData]);

  const handleFetchReport = async () => {
    if (!fetchForm.name || !fetchForm.mobile || !fetchForm.identifier_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsFetching(true);
      
      const payload: any = {
        provider: fetchForm.provider,
        name: fetchForm.name,
        mobile: fetchForm.mobile,
        loan_id: fetchForm.loan_id || undefined,
        lead_id: fetchForm.lead_id || undefined,
        gender: fetchForm.gender
      };

      if (fetchForm.identifier_type === 'pan') {
        payload.pan = fetchForm.identifier_value;
      } else {
        payload.aadhaar = fetchForm.identifier_value;
        payload.id_number = fetchForm.identifier_value;
        payload.id_type = 'aadhaar';
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-6 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20">
                <CreditCard className="text-white h-6 w-6" />
              </div>
              Fetch Credit History
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Real-time analysis powered by Surepass & Credit Bureaus.
            </DialogDescription>
          </DialogHeader>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bureau Provider</label>
              <Select 
                value={fetchForm.provider} 
                onValueChange={(v) => setFetchForm({...fetchForm, provider: v})}
              >
                <SelectTrigger className="rounded-xl border-slate-200 h-11 font-bold">
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  {CREDIT_SCORE_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="font-medium">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
              <Select 
                value={fetchForm.gender} 
                onValueChange={(v) => setFetchForm({...fetchForm, gender: v})}
              >
                <SelectTrigger className="rounded-xl border-slate-200 h-11 font-bold">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="male" className="font-medium">Male</SelectItem>
                  <SelectItem value="female" className="font-medium">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name (KYC Match)</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="e.g. Mehar Singh" 
                  className="rounded-xl border-slate-200 h-11 pl-10 font-bold placeholder:text-slate-300"
                  value={fetchForm.name}
                  onChange={(e) => setFetchForm({...fetchForm, name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number</label>
                <Input 
                  placeholder="10-digit primary" 
                  maxLength={10}
                  className="rounded-xl border-slate-200 h-11 font-bold placeholder:text-slate-300"
                  value={fetchForm.mobile}
                  onChange={(e) => setFetchForm({...fetchForm, mobile: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{fetchForm.loan_id ? 'Loan ID' : 'Lead ID'}</label>
                <Input 
                  placeholder="Internal ID" 
                  readOnly
                  className="rounded-xl border-slate-100 bg-slate-50 h-11 font-bold text-slate-400"
                  value={fetchForm.loan_id || fetchForm.lead_id}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Identification</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setFetchForm({...fetchForm, identifier_type: 'pan'})}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${fetchForm.identifier_type === 'pan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                  >PAN</button>
                  <button 
                    onClick={() => setFetchForm({...fetchForm, identifier_type: 'aadhaar'})}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${fetchForm.identifier_type === 'aadhaar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                  >AADHAAR</button>
                </div>
              </div>
              <Input 
                placeholder={fetchForm.identifier_type === 'pan' ? "e.g. ABCDE1234F" : "12-digit Aadhaar Number"} 
                className="rounded-xl border-slate-200 h-11 font-mono font-black placeholder:text-slate-300"
                value={fetchForm.identifier_value}
                onChange={(e) => setFetchForm({...fetchForm, identifier_value: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <Button 
            className="w-full rounded-2xl h-14 text-md font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all" 
            onClick={handleFetchReport}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Validating Bureau Data...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Authorize & Fetch Report
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-tighter">
            By clicking, you confirm customer consent for bureau verification
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

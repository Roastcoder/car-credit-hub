import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, FileText, CreditCard, Building2, User, Calendar } from 'lucide-react';

interface VoucherData {
  voucher_number: string;
  voucher_date: string;
  payment_method: string;
  reference_number: string;
  narration: string;
  prepared_by: string;
  approved_by: string;
}

export default function CreatePaymentVoucher() {
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<VoucherData>({
    voucher_number: '',
    voucher_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: '',
    narration: '',
    prepared_by: user?.name || '',
    approved_by: ''
  });

  // Generate voucher number
  useEffect(() => {
    const generateVoucherNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `VCH-${year}${month}-${random}`;
    };

    if (!form.voucher_number) {
      setForm(prev => ({ ...prev, voucher_number: generateVoucherNumber() }));
    }
  }, [form.voucher_number]);

  // Fetch payment details
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch payment');
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!paymentId,
  });

  // Create voucher
  const createVoucher = useMutation({
    mutationFn: async (data: VoucherData) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/payments/${paymentId}/voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...data,
          created_by: user?.id
        })
      });
      if (!response.ok) throw new Error('Failed to create voucher');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment voucher created successfully!');
      navigate('/payments');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create voucher');
    }
  });

  const update = (key: keyof VoucherData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.payment_method || !form.reference_number || !form.narration) {
      toast.error('Please fill all required fields');
      return;
    }

    createVoucher.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading payment details...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Payment not found</p>
        <button onClick={() => navigate('/payments')} className="mt-4 text-accent hover:underline text-sm">
          ← Back to payments
        </button>
      </div>
    );
  }

  // Check if user has permission and payment is in correct status
  if (user?.role !== 'accounts') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          Only accounts department can create payment vouchers.
        </p>
        <button onClick={() => navigate('/payments')} className="text-accent hover:underline text-sm">
          ← Back to payments
        </button>
      </div>
    );
  }

  if (payment.status !== 'manager_approved') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Payment Not Ready</h2>
        <p className="text-muted-foreground mb-4">
          Vouchers can only be created for manager approved payments.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Current Status: <span className="font-medium capitalize">{payment.status.replace(/_/g, ' ')}</span>
        </p>
        <button onClick={() => navigate('/payments')} className="text-accent hover:underline text-sm">
          ← Back to payments
        </button>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all";
  const labelClass = "block text-xs font-medium text-foreground/70 mb-1.5";

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 lg:pb-4">
      <button 
        onClick={() => navigate('/payments')} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Payments
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Create Payment Voucher</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Payment ID: <span className="font-medium text-accent">{payment.payment_id || `PAY-${payment.id}`}</span></span>
          <span>•</span>
          <span>Amount: <span className="font-medium">{formatCurrency(Number(payment.amount))}</span></span>
          <span>•</span>
          <span>Beneficiary: <span className="font-medium">{payment.beneficiary_name}</span></span>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-accent" />
          Payment Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Loan Details</p>
              <p className="font-medium text-foreground">{payment.loan_number}</p>
              <p className="text-sm text-muted-foreground">{payment.applicant_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payment Type</p>
              <p className="font-medium text-foreground capitalize">{payment.payment_type?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-xl font-bold text-accent">{formatCurrency(Number(payment.amount))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Purpose</p>
              <p className="font-medium text-foreground">{payment.description}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bank Details</p>
              <p className="font-medium text-foreground">{payment.bank_name}</p>
              <p className="text-sm text-muted-foreground">{payment.account_number}</p>
              <p className="text-sm text-muted-foreground">{payment.ifsc_code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText size={20} className="text-accent" />
            Voucher Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voucher Information */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Voucher Number</label>
                <input 
                  type="text" 
                  className={`${inputClass} bg-muted/50`}
                  value={form.voucher_number} 
                  onChange={e => update('voucher_number', e.target.value)}
                  readOnly
                />
              </div>
              
              <div>
                <label className={labelClass}>Voucher Date *</label>
                <input 
                  type="date" 
                  className={inputClass}
                  value={form.voucher_date} 
                  onChange={e => update('voucher_date', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className={labelClass}>Payment Method *</label>
                <select 
                  className={inputClass}
                  value={form.payment_method} 
                  onChange={e => update('payment_method', e.target.value)}
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="neft">NEFT</option>
                  <option value="rtgs">RTGS</option>
                  <option value="imps">IMPS</option>
                  <option value="cheque">Cheque</option>
                  <option value="dd">Demand Draft</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>

            {/* Reference and Authorization */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Reference Number *</label>
                <input 
                  type="text" 
                  className={inputClass}
                  value={form.reference_number} 
                  onChange={e => update('reference_number', e.target.value)}
                  placeholder="Transaction/Cheque/DD Number"
                  required
                />
              </div>
              
              <div>
                <label className={labelClass}>Prepared By</label>
                <input 
                  type="text" 
                  className={`${inputClass} bg-muted/50`}
                  value={form.prepared_by} 
                  readOnly
                />
              </div>
              
              <div>
                <label className={labelClass}>Approved By</label>
                <input 
                  type="text" 
                  className={inputClass}
                  value={form.approved_by} 
                  onChange={e => update('approved_by', e.target.value)}
                  placeholder="Manager/Authorized Person Name"
                />
              </div>
            </div>
          </div>

          {/* Narration */}
          <div>
            <label className={labelClass}>Narration/Description *</label>
            <textarea 
              className={inputClass}
              rows={4}
              value={form.narration} 
              onChange={e => update('narration', e.target.value)}
              placeholder="Payment description and purpose"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="px-6 py-2 rounded-lg border border-border font-medium hover:bg-muted transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createVoucher.isPending}
              className="px-6 py-2 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-60 text-sm"
            >
              {createVoucher.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Voucher...
                </span>
              ) : 'Create Voucher'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
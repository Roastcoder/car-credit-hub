import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Upload, FileText, X, Eye, Plus } from 'lucide-react';

interface PaymentFormData {
  loan_id: string;
  payment_type: string;
  amount: string;
  description: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  beneficiary_name: string;
  purpose: string;
  supporting_documents: string[];
  remarks: string;
}

export default function CreatePaymentApplication() {
  const navigate = useNavigate();
  const { loanId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PaymentFormData>({
    loan_id: loanId || '',
    payment_type: '',
    amount: '',
    description: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    beneficiary_name: '',
    purpose: '',
    supporting_documents: [],
    remarks: ''
  });

  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);

  // Fetch loan details
  const { data: loan, isLoading: loadingLoan } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/loans/${loanId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch loan');
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!loanId,
  });

  // Fetch PDD documents
  const { data: pddDocuments = [] } = useQuery({
    queryKey: ['pdd-documents', loanId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/loans/${loanId}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!loanId,
  });

  // Create payment application
  const createPayment = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...data,
          created_by: user?.id,
          status: 'pending'
        })
      });
      if (!response.ok) throw new Error('Failed to create payment application');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment application created successfully!');
      navigate('/payments');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create payment application');
    }
  });

  const update = (key: keyof PaymentFormData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleDocumentSelect = (doc: any) => {
    const isSelected = selectedDocuments.find(d => d.id === doc.id);
    if (isSelected) {
      setSelectedDocuments(prev => prev.filter(d => d.id !== doc.id));
      update('supporting_documents', form.supporting_documents.filter(id => id !== doc.id));
    } else {
      setSelectedDocuments(prev => [...prev, doc]);
      update('supporting_documents', [...form.supporting_documents, doc.id]);
    }
  };

  const previewDocument = async (doc: any) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const normalizedPath = doc.file_url.startsWith('/uploads') ? `/api${doc.file_url}` : doc.file_url;
      const fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `${baseUrl}${normalizedPath}`;
      
      setPreviewDoc({ url: fileUrl, name: doc.document_name || doc.file_name });
    } catch (error) {
      toast.error('Failed to load document');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.payment_type || !form.amount || !form.bank_name || !form.account_number || !form.ifsc_code) {
      toast.error('Please fill all required fields');
      return;
    }

    createPayment.mutate(form);
  };

  if (loadingLoan) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading loan details...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Loan not found</p>
        <button onClick={() => navigate('/loans')} className="mt-4 text-accent hover:underline text-sm">
          ← Back to loans
        </button>
      </div>
    );
  }

  // Check if loan is disbursed
  if (loan.status !== 'disbursed') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Loan Not Disbursed</h2>
        <p className="text-muted-foreground mb-4">
          Payment applications can only be created for disbursed loans.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Current Status: <span className="font-medium capitalize">{loan.status.replace(/_/g, ' ')}</span>
        </p>
        <button onClick={() => navigate('/loans')} className="text-accent hover:underline text-sm">
          ← Back to loans
        </button>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all";
  const labelClass = "block text-xs font-medium text-foreground/70 mb-1.5";

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 pb-20 lg:pb-4">
        <button 
          onClick={() => navigate('/payments')} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Payments
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create Payment Application</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Loan: <span className="font-medium text-accent">{loan.loan_number || loan.id}</span></span>
            <span>•</span>
            <span>Customer: <span className="font-medium">{loan.applicant_name}</span></span>
            <span>•</span>
            <span>Amount: <span className="font-medium">{formatCurrency(Number(loan.loan_amount))}</span></span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm space-y-6">
            
            {/* Payment Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Payment Type *</label>
                  <select 
                    className={inputClass} 
                    value={form.payment_type} 
                    onChange={e => update('payment_type', e.target.value)}
                    required
                  >
                    <option value="">Select Payment Type</option>
                    <option value="commission">Commission Payment</option>
                    <option value="refund">Refund</option>
                    <option value="processing_fee_refund">Processing Fee Refund</option>
                    <option value="insurance_claim">Insurance Claim</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Amount *</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={form.amount} 
                    onChange={e => update('amount', e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Purpose/Description *</label>
                  <textarea 
                    className={inputClass} 
                    rows={3}
                    value={form.description} 
                    onChange={e => update('description', e.target.value)}
                    placeholder="Describe the purpose of this payment"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Banking Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Banking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Bank Name *</label>
                  <input 
                    type="text" 
                    className={inputClass} 
                    value={form.bank_name} 
                    onChange={e => update('bank_name', e.target.value)}
                    placeholder="Enter bank name"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Account Number *</label>
                  <input 
                    type="text" 
                    className={inputClass} 
                    value={form.account_number} 
                    onChange={e => update('account_number', e.target.value)}
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>IFSC Code *</label>
                  <input 
                    type="text" 
                    className={inputClass} 
                    value={form.ifsc_code} 
                    onChange={e => update('ifsc_code', e.target.value.toUpperCase())}
                    placeholder="Enter IFSC code"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Beneficiary Name *</label>
                  <input 
                    type="text" 
                    className={inputClass} 
                    value={form.beneficiary_name} 
                    onChange={e => update('beneficiary_name', e.target.value)}
                    placeholder="Enter beneficiary name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Supporting Documents */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Supporting Documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select relevant documents from PDD to support this payment application
              </p>
              
              {pddDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pddDocuments.map((doc: any) => {
                    const isSelected = selectedDocuments.find(d => d.id === doc.id);
                    return (
                      <div 
                        key={doc.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-accent bg-accent/5' 
                            : 'border-border hover:border-accent/50 hover:bg-muted/50'
                        }`}
                        onClick={() => handleDocumentSelect(doc)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.document_name || doc.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.document_type?.replace(/_/g, ' ').toUpperCase()}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center ml-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              previewDocument(doc);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                          >
                            <Eye size={12} />
                            Preview
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <FileText size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No PDD documents available</p>
                </div>
              )}

              {selectedDocuments.length > 0 && (
                <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Selected Documents ({selectedDocuments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocuments.map(doc => (
                      <span 
                        key={doc.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full"
                      >
                        {doc.document_name || doc.file_name}
                        <button
                          type="button"
                          onClick={() => handleDocumentSelect(doc)}
                          className="hover:bg-accent/20 rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Additional Information</h3>
              <div>
                <label className={labelClass}>Remarks</label>
                <textarea 
                  className={inputClass} 
                  rows={3}
                  value={form.remarks} 
                  onChange={e => update('remarks', e.target.value)}
                  placeholder="Any additional remarks or notes"
                />
              </div>
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
                disabled={createPayment.isPending}
                className="px-6 py-2 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-60 text-sm"
              >
                {createPayment.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : 'Create Payment Application'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {previewDoc.name}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
              {previewDoc.url.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[600px] border border-border rounded-lg"
                  title={previewDoc.name}
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-w-full h-auto rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
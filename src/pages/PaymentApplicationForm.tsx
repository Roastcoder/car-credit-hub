import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Upload, FileText, Plus, X, Save, Send, 
  User, Building2, CreditCard, Calendar,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';

interface PaymentApplication {
  id?: number;
  loan_id: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  payment_amount: number;
  payment_purpose: string;
  pdd_documents: string[];
  banking_documents: string[];
  remarks: string;
  status: 'draft' | 'submitted' | 'manager_approved' | 'account_processing' | 'voucher_created' | 'payment_released' | 'completed';
  created_by: number;
  approved_by?: number;
  processed_by?: number;
}

export default function PaymentApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loanId } = useParams();
  const [loading, setLoading] = useState(false);
  const [loanData, setLoanData] = useState<any>(null);
  const [pddDocuments, setPddDocuments] = useState<any[]>([]);
  const [selectedPddDocs, setSelectedPddDocs] = useState<string[]>([]);
  const [bankingDocs, setBankingDocs] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<PaymentApplication>({
    loan_id: loanId || '',
    applicant_name: '',
    applicant_phone: '',
    applicant_email: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    payment_amount: 0,
    payment_purpose: '',
    pdd_documents: [],
    banking_documents: [],
    remarks: '',
    status: 'draft',
    created_by: user?.id || 0
  });

  useEffect(() => {
    if (loanId) {
      fetchLoanData();
      fetchPddDocuments();
    }
  }, [loanId]);

  const fetchLoanData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/loans/${loanId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      setLoanData(data);
      
      // Pre-fill applicant data from loan
      setFormData(prev => ({
        ...prev,
        applicant_name: data.customer_name || '',
        applicant_phone: data.customer_phone || '',
        applicant_email: data.customer_email || ''
      }));
    } catch (error) {
      console.error('Error fetching loan data:', error);
      toast.error('Failed to fetch loan data');
    }
  };

  const fetchPddDocuments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/loans/${loanId}/pdd-documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      setPddDocuments(data);
    } catch (error) {
      console.error('Error fetching PDD documents:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePddDocumentToggle = (docPath: string) => {
    setSelectedPddDocs(prev => {
      const updated = prev.includes(docPath) 
        ? prev.filter(doc => doc !== docPath)
        : [...prev, docPath];
      
      setFormData(prevForm => ({
        ...prevForm,
        pdd_documents: updated
      }));
      
      return updated;
    });
  };

  const handleBankingDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBankingDocs(prev => [...prev, ...files]);
  };

  const removeBankingDoc = (index: number) => {
    setBankingDocs(prev => prev.filter((_, i) => i !== index));
  };

  const uploadBankingDocuments = async () => {
    const uploadedPaths: string[] = [];
    
    for (const file of bankingDocs) {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', 'banking');
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/upload-document`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: formData
        });
        
        const result = await response.json();
        if (result.path) {
          uploadedPaths.push(result.path);
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    return uploadedPaths;
  };

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    try {
      setLoading(true);
      
      // Upload banking documents first
      const bankingDocPaths = await uploadBankingDocuments();
      
      const applicationData = {
        ...formData,
        banking_documents: bankingDocPaths,
        status
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(applicationData)
      });
      
      if (!response.ok) throw new Error('Failed to submit application');
      
      const result = await response.json();
      
      toast.success(status === 'draft' ? 'Application saved as draft' : 'Application submitted successfully');
      navigate('/payments');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'manager_approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'account_processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'voucher_created': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'payment_released': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Application Form</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create a payment application for loan disbursement
        </p>
        {loanData && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              <strong>Loan:</strong> {loanData.loan_number} - {loanData.customer_name} 
              <span className="ml-4"><strong>Amount:</strong> ₹{loanData.loan_amount?.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      <form className="space-y-8">
        {/* Applicant Information */}
        <div className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Applicant Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="applicant_name"
                value={formData.applicant_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="applicant_phone"
                value={formData.applicant_phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="applicant_email"
                value={formData.applicant_email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Banking Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IFSC Code *
              </label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch Name *
              </label>
              <input
                type="text"
                name="branch_name"
                value={formData.branch_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount *
              </label>
              <input
                type="number"
                name="payment_amount"
                value={formData.payment_amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Purpose *
              </label>
              <select
                name="payment_purpose"
                value={formData.payment_purpose}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Purpose</option>
                <option value="loan_disbursement">Loan Disbursement</option>
                <option value="processing_fee_refund">Processing Fee Refund</option>
                <option value="insurance_refund">Insurance Refund</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional remarks or instructions..."
            />
          </div>
        </div>

        {/* PDD Documents Selection */}
        <div className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PDD Documents</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">(Select from existing PDD documents)</span>
          </div>
          
          {pddDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pddDocuments.map((doc, index) => (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPddDocs.includes(doc.file_path)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handlePddDocumentToggle(doc.file_path)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedPddDocs.includes(doc.file_path)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {selectedPddDocs.includes(doc.file_path) ? <CheckCircle size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.document_type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {doc.file_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No PDD documents found for this loan</p>
            </div>
          )}
        </div>

        {/* Banking Documents Upload */}
        <div className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
              <Upload className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Banking Documents</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">(Upload bank statements, cheque copies, etc.)</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="file"
                id="banking-docs"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleBankingDocUpload}
                className="hidden"
              />
              <label
                htmlFor="banking-docs"
                className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Click to upload banking documents or drag and drop
                </span>
              </label>
            </div>
            
            {bankingDocs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Documents:</h4>
                {bankingDocs.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBankingDoc(index)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              Save as Draft
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit('submitted')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
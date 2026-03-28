import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { paymentApplicationAPI } from '@/lib/api';
import { 
  FileText, Calendar, CreditCard, Building2, User,
  Save, Send, Download, Eye, CheckCircle
} from 'lucide-react';

interface PaymentVoucher {
  id?: number;
  payment_application_id: number;
  voucher_number: string;
  voucher_date: string;
  payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'upi';
  bank_account: string;
  reference_number: string;
  amount: number;
  description: string;
  created_by: number;
  status: 'draft' | 'created' | 'released';
  utr_number?: string;
}

export default function PaymentVoucherForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [loading, setLoading] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  
  const [voucherData, setVoucherData] = useState<PaymentVoucher>({
    payment_application_id: parseInt(applicationId || '0'),
    voucher_number: '',
    voucher_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    bank_account: '',
    reference_number: '',
    amount: 0,
    description: '',
    created_by: user?.id || 0,
    status: 'draft'
  });

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
      generateVoucherNumber();
    }
  }, [applicationId]);

  const fetchApplicationData = async () => {
    try {
      const data = await paymentApplicationAPI.getById(parseInt(applicationId || '0'));
      setApplicationData(data);
      
      // Pre-fill voucher data
      setVoucherData(prev => ({
        ...prev,
        amount: data.payment_amount,
        description: `Payment for ${data.payment_purpose} - ${data.applicant_name}`,
        bank_account: `${data.bank_name} - ${data.account_number}`
      }));
    } catch (error) {
      console.error('Error fetching application data:', error);
      toast.error('Failed to fetch application data');
    }
  };

  const generateVoucherNumber = async () => {
    try {
      const { nextVoucherNumber } = await paymentApplicationAPI.getNextVoucherNumber();
      setVoucherData(prev => ({
        ...prev,
        voucher_number: nextVoucherNumber
      }));
    } catch (error) {
      console.error('Error generating voucher number:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVoucherData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (status: 'draft' | 'created') => {
    try {
      setLoading(true);
      
      await paymentApplicationAPI.createVoucher({
        ...voucherData,
        status
      });
      
      toast.success(status === 'draft' ? 'Voucher saved as draft' : 'Payment voucher created successfully');
      navigate('/account/vouchers'); // Redirect to the new vouchers list
      
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast.error('Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'manager_approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'account_processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (!applicationData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Payment Voucher</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create a payment voucher for approved payment application
        </p>
      </div>

      {/* Application Summary */}
      <div className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Application Details</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(applicationData?.status)}`}>
            {(applicationData?.status || '').replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Applicant</p>
            <p className="font-medium text-gray-900 dark:text-white">{applicationData.applicant_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
            <p className="font-medium text-gray-900 dark:text-white">₹{applicationData.payment_amount?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Purpose</p>
            <p className="font-medium text-gray-900 dark:text-white">{applicationData.payment_purpose}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bank</p>
            <p className="font-medium text-gray-900 dark:text-white">{applicationData.bank_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
            <p className="font-medium text-gray-900 dark:text-white">{applicationData.account_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">IFSC Code</p>
            <p className="font-medium text-gray-900 dark:text-white">{applicationData.ifsc_code}</p>
          </div>
        </div>
      </div>

      <form className="space-y-8">
        {/* Voucher Information */}
        <div className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Voucher Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voucher Number *
              </label>
              <input
                type="text"
                name="voucher_number"
                value={voucherData.voucher_number}
                onChange={handleInputChange}
                required
                readOnly
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voucher Date *
              </label>
              <input
                type="date"
                name="voucher_date"
                value={voucherData.voucher_date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={voucherData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method *
              </label>
              <select
                name="payment_method"
                value={voucherData.payment_method}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Account *
              </label>
              <input
                type="text"
                name="bank_account"
                value={voucherData.bank_account}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                name="reference_number"
                value={voucherData.reference_number}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Transaction reference number"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={voucherData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Payment description..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/account')}
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
              onClick={() => handleSubmit('created')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {loading ? 'Creating...' : 'Create Voucher'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
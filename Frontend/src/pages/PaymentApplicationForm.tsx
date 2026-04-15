import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { paymentApplicationAPI, loansAPI } from '@/lib/api';
import {
  Upload, FileText, Plus, X, Save, Send,
  User, Building2, CreditCard, Calendar,
  AlertCircle, CheckCircle, Clock, Search, ChevronRight, List, Info
} from 'lucide-react';
import MobilePageSwitcher from '@/components/MobilePageSwitcher';

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
  status: 'draft' | 'submitted' | 'manager_approved' | 'manager_rejected' | 'sent_back' | 'account_processing' | 'voucher_created' | 'payment_released' | 'completed';
  created_by: number;
  approved_by?: number;
  processed_by?: number;
  manager_remarks?: string;

  // New fields
  kyc_documents?: string;
  financier_name?: string;
  disbursement_amount?: number;
  tenure_months?: number;
  emi_amount?: number;
  emi_mode?: string;
  irr_percentage?: number;
  loan_type?: string;
  file_booked_code?: string;
  vehicle_name?: string;
  vehicle_model?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  disbursement_branch?: string;
  branch_manager_name?: string;
  rto_agent_name?: string;
  rto_mobile?: string;
  dto_location?: string;
  rto_work_type?: string;
  rto_doc_location?: string;
  rc_status?: string;
  noc_status?: string;
  noc_checked_by?: string;
  insurance_available?: boolean;
  third_party_stamp?: boolean;
  noc_stamp?: boolean;
  is_third_party?: boolean;
  foreclosure_amount?: number;
  foreclosure_name?: string;
  old_release_amount?: number;
  today_release_amount?: number;
  total_release_amount?: number;
  total_release_percentage?: number;
  hold_amount?: number;
  hold_percentage?: number;
  challan_amount?: number;
  payment_in_favour_name?: string;
  dm_approval?: boolean;
  loan_number?: string;
  disbursement_date?: string;
  loan_amount?: number;
}

export default function PaymentApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { loanId, id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loanData, setLoanData] = useState<any>(null);

  const appSwitcherOptions = [
    { label: 'Application List', path: '/payments', icon: <List size={18} /> },
    { label: id ? 'Edit App' : 'New App', path: location.pathname, icon: <Plus size={18} /> },
  ];
  const [pddDocuments, setPddDocuments] = useState<any[]>([]);
  const [selectedPddDocs, setSelectedPddDocs] = useState<string[]>([]);
  const [bankingDocs, setBankingDocs] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Aadhaar Verification States
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarVerificationStatus, setAadhaarVerificationStatus] = useState<'idle' | 'verifying' | 'otp_sent' | 'verified' | 'error'>('idle');
  const [aadhaarMessage, setAadhaarMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

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
    created_by: user?.id || 0,

    // Initializing new fields
    kyc_documents: 'No',
    financier_name: '',
    disbursement_amount: 0,
    tenure_months: 0,
    emi_amount: 0,
    emi_mode: '',
    irr_percentage: 0,
    loan_type: 'New',
    file_booked_code: '',
    vehicle_name: '',
    vehicle_model: '',
    vehicle_number: '',
    vehicle_type: '',
    disbursement_branch: '',
    branch_manager_name: '',
    rto_agent_name: '',
    rto_mobile: '',
    dto_location: '',
    rto_work_type: '',
    rto_doc_location: '',
    rc_status: 'Pending',
    noc_status: 'Pending',
    noc_checked_by: '',
    insurance_available: false,
    third_party_stamp: false,
    noc_stamp: false,
    is_third_party: false,
    foreclosure_amount: 0,
    foreclosure_name: '',
    old_release_amount: 0,
    today_release_amount: 0,
    total_release_amount: 0,
    total_release_percentage: 0,
    hold_amount: 0,
    hold_percentage: 0,
    challan_amount: 0,
    dm_approval: false,
    disbursement_date: '',
    loan_amount: 0
  });

  useEffect(() => {
    if (id) {
      fetchApplicationData();
    } else if (loanId) {
      fetchLoanData();
      fetchPddDocuments();
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [loanId, id]);

  const editableStatuses = ['draft', 'submitted', 'manager_rejected', 'sent_back'];
  const isReadOnly = !!id && !!formData.status && !editableStatuses.includes(formData.status);

  const fetchApplicationData = async () => {
    try {
      const data = await paymentApplicationAPI.getById(parseInt(id || '0'));
      setFormData(data);
      if (data.pdd_documents) {
        setSelectedPddDocs(data.pdd_documents);
      }
      // Also fetch PDD documents for the loan associated with this application
      if (data.loan_id) {
        fetchPddDocumentsById(data.loan_id);
        // Also fetch the full loan details to fill the read-only or supplemental fields
        fetchLoanDataById(data.loan_id);
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
      toast.error('Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPddDocumentsById = async (lId: string) => {
    try {
      // Fetch ALL loan documents (not just PDD)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${lId}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPddDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching loan documents:', error);
    }
  };

  useEffect(() => {
    // Calculate Total Release and Percentages based on Net Disbursement Amount
    const oldAmt = Number(formData.old_release_amount) || 0;
    const todayAmt = Number(formData.today_release_amount) || 0;
    const totalAmt = oldAmt + todayAmt;
    const disbursementAmt = Number(formData.disbursement_amount) || 0;
    const holdAmt = Number(formData.hold_amount) || 0;

    const totalPerc = disbursementAmt > 0 ? (totalAmt / disbursementAmt) * 100 : 0;
    const holdPerc = disbursementAmt > 0 ? (holdAmt / disbursementAmt) * 100 : 0;
    const paymentAmt = todayAmt; // Sync payment_amount with today_release_amount

    setFormData(prev => {
      const totalReleasePerc = parseFloat(totalPerc.toFixed(2));
      const hPerc = parseFloat(holdPerc.toFixed(2));

      // Only update if values actually changed to prevent unnecessary re-renders
      if (prev.total_release_amount === totalAmt &&
        prev.total_release_percentage === totalReleasePerc &&
        prev.hold_percentage === hPerc &&
        prev.payment_amount === paymentAmt) {
        return prev;
      }

      return {
        ...prev,
        total_release_amount: totalAmt,
        total_release_percentage: totalReleasePerc,
        hold_percentage: hPerc,
        payment_amount: paymentAmt
      };
    });
  }, [formData.old_release_amount, formData.today_release_amount, formData.disbursement_amount, formData.hold_amount]);

  const fetchLoanData = async () => {
    if (loanId) await fetchLoanDataById(loanId);
  };

  const fetchLoanDataById = async (lId: string) => {
    try {
      const data = await loansAPI.getById(lId);
      setLoanData(data.data || data);
      const d = data.data || data;

      // Pre-fill applicant and loan data
      setFormData(prev => ({
        ...prev,
        applicant_name: prev.applicant_name || d.customer_name || d.applicant_name || d.applicantName || '',
        applicant_phone: prev.applicant_phone || d.mobile || d.customer_phone || d.customerPhone || '',
        applicant_email: prev.applicant_email || d.customer_email || '',
        loan_number: d.loan_number || '',
        financier_name: prev.financier_name || d.assigned_bank_name || d.bank_name || '',
        loan_amount: prev.loan_amount || Number(d.loan_amount) || 0,
        disbursement_amount: prev.disbursement_amount || Number(d.net_disbursement_amount || d.disbursement_amount) || 0,
        disbursement_date: prev.disbursement_date || (d.disbursement_date ? new Date(d.disbursement_date).toISOString().split('T')[0] : ''),
        tenure_months: prev.tenure_months || d.tenure_months || d.tenure || 0,
        emi_amount: prev.emi_amount || Number(d.emi_amount || d.emi) || 0,
        emi_mode: prev.emi_mode || d.emi_mode || '',
        irr_percentage: prev.irr_percentage || Number(d.irr || d.interestRate) || 0,
        loan_type: prev.loan_type || (d.refinance ? 'Refinance' : 'New'),
        vehicle_name: prev.vehicle_name || d.maker_name || d.carMake || '',
        vehicle_model: prev.vehicle_model || d.model_variant_name || d.carModel || d.carVariant || '',
        vehicle_number: prev.vehicle_number || d.vehicle_number || '',
        vehicle_type: prev.vehicle_type || d.vehicle_type || d.category || '',
        branch_name: prev.branch_name || d.our_branch || '',
        disbursement_branch: prev.disbursement_branch || d.disburse_branch_name || '',
        branch_manager_name: prev.branch_manager_name || d.branch_manager || '',
        rto_agent_name: prev.rto_agent_name || d.rto_agent_name || '',
        rto_mobile: prev.rto_mobile || d.rto_agent_mobile || d.agent_mobile_no || '',
        dto_location: prev.dto_location || d.dto_location || '',
        rto_work_type: prev.rto_work_type || d.rto_work_description || d.rto_work || '',
        rto_doc_location: prev.rto_doc_location || d.rto_docs_location || '',
        rc_status: prev.rc_status || d.rto_work_status || 'Pending',
        noc_status: prev.noc_status || d.noc_status || 'Pending',
        noc_checked_by: prev.noc_checked_by || d.noc_checked_by || '',
        kyc_documents: prev.kyc_documents || (d.rto_rc_owner_kyc ? 'Yes' : 'No'),
        insurance_available: prev.insurance_available || d.insurance_status === 'Approved' || !!d.insurance_copy,
        foreclosure_amount: prev.foreclosure_amount || Number(d.foreclosure_amount) || 0,
        foreclosure_name: d.foreclosure_bank_name || '',
        hold_amount: prev.hold_amount || Number(d.hold_amount) || 0,
        challan_amount: prev.challan_amount || Number(d.rto_challan_amount) || 0,
        payment_in_favour_name: prev.payment_in_favour_name || d.payment_in_favour || ''
      }));
    } catch (error) {
      console.error('Error fetching loan data:', error);
      toast.error('Failed to fetch loan data');
    }
  };

  const fetchPddDocuments = async () => {
    try {
      // Fetch ALL loan documents for the loan
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanId}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPddDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching loan documents:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearching(true);
      setShowSearchResults(true);
      const response = await loansAPI.getAll({ search: query, forPayment: 'true' });
      const results = (response.data || []).map((loan: any) => ({
        ...loan,
        _displayName: loan.customer_name || loan.applicant_name || 'Unknown'
      }));
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectLoan = (loan: any) => {
    setShowSearchResults(false);
    setSearchQuery(loan._displayName || loan.customer_name || loan.applicant_name || '');
    // IMPORTANT: set loan_id so the payment is saved with the correct loan reference
    setFormData(prev => ({ ...prev, loan_id: String(loan.id) }));
    fetchLoanDataById(loan.id.toString());
    fetchPddDocumentsById(loan.id.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const numValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => {
      const newData = { ...prev, [name]: numValue };

      // Reciprocal updates for Hold and Release amounts
      const disbursementAmt = Number(newData.disbursement_amount) || 0;
      const oldAmt = Number(newData.old_release_amount) || 0;

      if (name === 'today_release_amount') {
        const remaining = disbursementAmt - oldAmt - (numValue as number);
        newData.hold_amount = Math.max(0, parseFloat(remaining.toFixed(2)));
      } else if (name === 'hold_amount') {
        const releaseNeeded = disbursementAmt - oldAmt - (numValue as number);
        newData.today_release_amount = Math.max(0, parseFloat(releaseNeeded.toFixed(2)));
      } else if (name === 'disbursement_amount') {
        // If disbursement changes, adjust hold to maintain today_release
        const todayAmt = Number(newData.today_release_amount) || 0;
        newData.hold_amount = Math.max(0, parseFloat((numValue as number - oldAmt - todayAmt).toFixed(2)));
      }

      return newData;
    });
  };

  const handlePddDocumentToggle = (docIdentifier: string) => {
    if (isReadOnly) return;
    setSelectedPddDocs(prev => {
      const updated = prev.includes(docIdentifier)
        ? prev.filter(doc => doc !== docIdentifier)
        : [...prev, docIdentifier];

      setFormData(prevForm => ({
        ...prevForm,
        pdd_documents: updated
      }));

      return updated;
    });
  };

  const handleBankingDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = Array.from(e.target.files || []);
    setBankingDocs(prev => [...prev, ...files]);
  };

  const removeBankingDoc = (index: number) => {
    if (isReadOnly) return;
    setBankingDocs(prev => prev.filter((_, i) => i !== index));
  };

  const uploadBankingDocuments = async () => {
    const uploadedPaths: string[] = [];

    for (const file of bankingDocs) {
      try {
        const result = await paymentApplicationAPI.uploadDocument(file);
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

  // Aadhaar Verification Functions
  const initiateAadhaarVerification = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!formData.applicant_phone || formData.applicant_phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setAadhaarVerificationStatus('verifying');
    setAadhaarMessage('Verifying Aadhaar...');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/aadhaar/verify-mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          aadhar_number: aadhaarNumber,
          mobile: formData.applicant_phone
        })
      });

      const data = await response.json();

      if (data.match) {
        // Send OTP
        const otpResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/send-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            phone: formData.applicant_phone,
            applicant_name: formData.applicant_name,
            payment_amount: formData.payment_amount
          })
        });

        const otpData = await otpResponse.json();

        if (otpResponse.ok) {
          setAadhaarVerificationStatus('otp_sent');
          setAadhaarMessage(`OTP sent to ******${formData.applicant_phone.slice(-3)}`);
          toast.success('OTP sent successfully!');
        } else {
          throw new Error(otpData.error || 'Failed to send OTP');
        }
      } else {
        setAadhaarVerificationStatus('error');
        setAadhaarMessage(data.message || 'Aadhaar verification failed');
        toast.error('Last 3 digits of Aadhaar do not match mobile number');
      }
    } catch (error: any) {
      setAadhaarVerificationStatus('error');
      setAadhaarMessage(error.message || 'Verification failed');
      toast.error(error.message || 'Verification failed');
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpVerifying(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          phone: formData.applicant_phone,
          otp: otp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAadhaarVerificationStatus('verified');
        setAadhaarMessage('Aadhaar and OTP verified successfully!');
        toast.success('Verification successful!');
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    try {
      // Check Aadhaar verification for submitted status
      if (status === 'submitted' && aadhaarVerificationStatus !== 'verified') {
        toast.error('Please complete Aadhaar verification before submitting');
        return;
      }

      setLoading(true);

      // Upload banking documents first
      const bankingDocPaths = await uploadBankingDocuments();

      const applicationData = {
        ...formData,
        banking_documents: [...(formData.banking_documents || []), ...bankingDocPaths],
        status,
        aadhaar_number: aadhaarNumber,
        aadhaar_verified: aadhaarVerificationStatus === 'verified'
      };

      if (id) {
        await paymentApplicationAPI.update(parseInt(id), applicationData);
      } else {
        await paymentApplicationAPI.create(applicationData);
      }

      toast.success(id ? 'Application updated successfully' : (status === 'draft' ? 'Application saved as draft' : 'Application submitted successfully'));
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
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <MobilePageSwitcher options={appSwitcherOptions} activeLabel={id ? 'Edit App' : 'New App'} />
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-blue-600" />
            {id ? 'Edit Payment Application' : 'New Payment Application'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {id ? `Application ID: #${id}` : 'Search for a customer to auto-fill loan details'}
          </p>
        </div>

        {/* Global Search Tool */}
        {!id && (
          <div className="w-full md:w-96 relative search-container">
            <FormField
              label="Customer ID / Name / Mobile"
              name="lookup"
              placeholder="Search by ID, name or phone..."
              icon={<Search className="h-5 w-5 !text-blue-500" />}
              value={searchQuery}
              onChange={(e: any) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto ring-1 ring-black/5">
                {searchResults.map((loan) => (
                  <button
                    key={loan.id}
                    type="button"
                    className="w-full px-5 py-4 text-left hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border-b border-gray-100 dark:border-gray-800 last:border-0 group transition-colors"
                    onClick={() => selectLoan(loan)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{loan._displayName}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider">{loan.loan_number}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                            <User size={12} /> {loan.mobile}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="absolute right-4 top-10">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        )}
      </div>

      <form className="space-y-8">
        {isReadOnly && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/10 dark:text-green-300">
            This request is closed after accounts processing. Voucher, UTR, and proof can still be viewed from the payment detail page, but the form is now read-only.
          </div>
        )}
        {formData.status === 'sent_back' && formData.manager_remarks && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800 dark:border-orange-900/40 dark:bg-orange-900/10 dark:text-orange-300 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900 dark:text-orange-200 mb-1">Attention: Required Corrections</p>
                <p className="whitespace-pre-wrap opacity-90">{formData.manager_remarks}</p>
              </div>
            </div>
          </div>
        )}
        {/* 1. Customer Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <User className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. Customer Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField label="Customer Name" name="applicant_name" value={formData.applicant_name} onChange={handleInputChange} required disabled={isReadOnly} />
            <FormField label="Loan Number" name="loan_number" value={formData.loan_number} onChange={handleInputChange} disabled />
            <FormField label="Mobile Number" name="applicant_phone" value={formData.applicant_phone} onChange={handleInputChange} required disabled={isReadOnly} />
            <FormSelect label="KYC Documents" name="kyc_documents" value={formData.kyc_documents} onChange={handleInputChange} options={['Yes', 'No']} disabled={isReadOnly} />
          </div>
        </section>

        {/* 2. Loan Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Building2 className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">2. Loan Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField label="Financier Name" name="financier_name" value={formData.financier_name} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Loan Amount" name="loan_amount" type="number" value={formData.loan_amount} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Disbursement Amount" name="disbursement_amount" type="number" value={formData.disbursement_amount} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Disbursement Date" name="disbursement_date" type="date" value={formData.disbursement_date} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Tenure (Months)" name="tenure_months" type="number" value={formData.tenure_months} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="EMI Amount" name="emi_amount" type="number" value={formData.emi_amount} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="EMI Mode" name="emi_mode" value={formData.emi_mode} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="IRR (%)" name="irr_percentage" type="number" value={formData.irr_percentage} onChange={handleInputChange} disabled={isReadOnly} />
            <FormSelect label="Loan Type" name="loan_type" value={formData.loan_type} onChange={handleInputChange} options={['New', 'Refinance']} disabled={isReadOnly} />
            <FormField label="File Booked Code" name="file_booked_code" value={formData.file_booked_code} onChange={handleInputChange} disabled={isReadOnly} />
          </div>
        </section>

        {/* 3. Vehicle Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Upload className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. Vehicle Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField label="Vehicle Name" name="vehicle_name" value={formData.vehicle_name} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Vehicle Model" name="vehicle_model" value={formData.vehicle_model} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Vehicle Number" name="vehicle_number" value={formData.vehicle_number} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Vehicle Type" name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} disabled={isReadOnly} />
          </div>
        </section>

        {/* 4. Branch & Manager Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Building2 className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">4. Branch & Manager Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Our Branch" name="branch_name" value={formData.branch_name} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Disbursement Branch" name="disbursement_branch" value={formData.disbursement_branch} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Branch Manager Name" name="branch_manager_name" value={formData.branch_manager_name} onChange={handleInputChange} disabled={isReadOnly} />
          </div>
        </section>

        {/* 5. RTO Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <FileText className="h-5 w-5 text-teal-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">5. RTO Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <FormField label="RTO Agent Name" name="rto_agent_name" value={formData.rto_agent_name} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="RTO Mobile Number" name="rto_mobile" value={formData.rto_mobile} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="DTO Location" name="dto_location" value={formData.dto_location} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="RTO Work" name="rto_work_type" value={formData.rto_work_type} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="RTO Document Location" name="rto_doc_location" value={formData.rto_doc_location} onChange={handleInputChange} disabled={isReadOnly} />
          </div>
        </section>

        {/* 6. Document & Status Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">6. Document & Status Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormSelect label="RC Status" name="rc_status" value={formData.rc_status} onChange={handleInputChange} options={['Pending', 'OK']} disabled={isReadOnly} />
            <FormSelect label="NOC Status" name="noc_status" value={formData.noc_status} onChange={handleInputChange} options={['Pending', 'OK']} disabled={isReadOnly} />
            <FormField label="Checked By (NOC Status)" name="noc_checked_by" value={formData.noc_checked_by} onChange={handleInputChange} disabled={isReadOnly} />
            <FormCheckbox label="Insurance Available" name="insurance_available" checked={formData.insurance_available} onChange={handleInputChange} disabled={isReadOnly} />
            <FormCheckbox label="3rd Party Stamp" name="third_party_stamp" checked={formData.third_party_stamp} onChange={handleInputChange} disabled={isReadOnly} />
            <FormCheckbox label="NOC Stamp" name="noc_stamp" checked={formData.noc_stamp} onChange={handleInputChange} disabled={isReadOnly} />
            <FormCheckbox label="Third Party" name="is_third_party" checked={formData.is_third_party} onChange={handleInputChange} disabled={isReadOnly} />
          </div>
        </section>

        {/* 7. Payment & Foreclosure Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Plus className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">7. Payment & Foreclosure Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="Foreclosure Amount" name="foreclosure_amount" type="number" value={formData.foreclosure_amount} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Foreclosure Name" name="foreclosure_name" value={formData.foreclosure_name} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Old Payment Release Amount" name="old_release_amount" type="number" value={formData.old_release_amount} onChange={handleInputChange} disabled={isReadOnly} />
            <FormField label="Today Payment Release Amount" name="today_release_amount" type="number" value={formData.today_release_amount} onChange={handleInputChange} disabled={isReadOnly} />
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200/50 dark:border-orange-800/20 shadow-sm">
              <label className="text-xs font-bold text-orange-600 uppercase mb-1 block text-left">Balance (Disbursement - Today Release)</label>
              <p className="text-2xl font-black text-orange-950 dark:text-orange-100 text-left underline decoration-double decoration-orange-300">
                ₹{((Number(formData.disbursement_amount) || 0) - (Number(formData.today_release_amount) || 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <label className="text-xs font-semibold text-blue-600 uppercase mb-1 block text-left">Total Payment Release Amount</label>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100 text-left">₹{formData.total_release_amount?.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <label className="text-xs font-semibold text-green-600 uppercase mb-1 block text-left">Total Payment Release (%)</label>
              <p className="text-xl font-bold text-green-900 dark:text-green-100 text-left">{formData.total_release_percentage}%</p>
            </div>
          </div>
        </section>

        {/* 8. Hold & Balance Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">8. Hold & Balance Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <FormField label="Challan Amount" name="challan_amount" type="number" value={formData.challan_amount} onChange={handleInputChange} disabled={isReadOnly} />
          </div>
        </section>

        {/* 9. Beneficiary Banking Details */}
        <section className="glass-card p-6 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm bg-blue-50/30 dark:bg-blue-900/5">
          <div className="flex items-center gap-3 mb-6 border-b border-blue-100 dark:border-blue-800 pb-4">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">9. Beneficiary Banking Details</h2>
            <span className="ml-auto text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-full uppercase tracking-wider">Payment To</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="Payment In Favour (Beneficiary Name) *" name="payment_in_favour_name" value={formData.payment_in_favour_name} onChange={handleInputChange} required placeholder="Enter beneficiary name" disabled={isReadOnly} />
            <FormField label="Bank Name *" name="bank_name" value={formData.bank_name} onChange={handleInputChange} required placeholder="Enter bank name" disabled={isReadOnly} />
            <FormField label="Account Number *" name="account_number" value={formData.account_number} onChange={handleInputChange} required placeholder="Enter account number" disabled={isReadOnly} />
            <FormField label="IFSC Code *" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} required placeholder="e.g. SBIN0001234" disabled={isReadOnly} />
            <FormField label="Branch Name" name="branch_name" value={formData.branch_name} onChange={handleInputChange} placeholder="Enter branch name" disabled={isReadOnly} />
            <FormCheckbox label="DM Approval" name="dm_approval" checked={formData.dm_approval} onChange={handleInputChange} disabled={isReadOnly} />
          </div>
        </section>

        {/* 10. Payment Details (Docs & Remarks) */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <FileText className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">10. Supporting Documents</h2>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Loan & PDD Docs */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-left">Loan Documents</label>
              <p className="text-xs text-gray-500 mb-4 text-left">Select documents attached to this loan</p>
              {pddDocuments.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {pddDocuments.map((doc, index) => {
                    const docKey = doc.file_url || doc.file_path || String(doc.id || index);
                    const docLabel = doc.document_name || doc.document_type || doc.file_name || `Document ${index + 1}`;
                    const isSelected = formData.pdd_documents.includes(docKey);
                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                          }`}
                        onClick={() => handlePddDocumentToggle(docKey)}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? <CheckCircle size={16} className="text-blue-500" /> : <FileText size={16} className="text-gray-400" />}
                          <div>
                            <span className="text-sm font-medium">{docLabel}</span>
                            {doc.document_type && doc.document_name && (
                              <p className="text-xs text-gray-400">{doc.document_type}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-gray-500 italic text-left">No documents found for this loan</p>}
            </div>

            {/* Banking Docs */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-left">Banking Documents</label>
              <input type="file" id="banking-docs" multiple onChange={handleBankingDocUpload} className="hidden" disabled={isReadOnly} />
              <label htmlFor="banking-docs" className={`flex items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors ${isReadOnly ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-900/30 dark:border-gray-800' : 'border-gray-300 rounded-lg cursor-pointer hover:border-blue-500'}`}>
                <Upload size={20} className="mr-2 text-gray-400" />
                <span className="text-sm text-gray-500">{isReadOnly ? 'Closed for upload' : 'Upload bank docs'}</span>
              </label>
              <div className="mt-2 space-y-1">
                {bankingDocs.map((file, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="truncate">{file.name}</span>
                    {!isReadOnly && <X size={14} className="text-red-500 cursor-pointer" onClick={() => removeBankingDoc(i)} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 text-left">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={3}
              disabled={isReadOnly}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Additional information..."
            />
          </div>
        </section>

        {/* 11. Aadhaar Verification */}
        {!isReadOnly && (
          <section className="glass-card p-6 rounded-xl border border-purple-200 dark:border-purple-800/50 shadow-sm bg-purple-50/30 dark:bg-purple-900/5">
            <div className="flex items-center gap-3 mb-6 border-b border-purple-100 dark:border-purple-800 pb-4">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">11. Aadhaar Verification</h2>
              <span className="ml-auto text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded-full uppercase tracking-wider">Required</span>
            </div>

            {aadhaarVerificationStatus === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Please verify the applicant's Aadhaar number before submitting the application.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Aadhaar Number *</label>
                    <input
                      type="text"
                      maxLength={12}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 12-digit Aadhaar number"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={initiateAadhaarVerification}
                      disabled={aadhaarNumber.length !== 12 || !formData.applicant_phone}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify Aadhaar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {aadhaarVerificationStatus === 'verifying' && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{aadhaarMessage}</p>
                </div>
              </div>
            )}

            {aadhaarVerificationStatus === 'otp_sent' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{aadhaarMessage}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Enter OTP *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={otp.length !== 6 || otpVerifying}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={initiateAadhaarVerification}
                      className="px-4 py-3 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-all font-semibold"
                    >
                      Resend
                    </button>
                  </div>
                </div>
              </div>
            )}

            {aadhaarVerificationStatus === 'verified' && (
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">Verification Successful!</p>
                    <p className="text-sm text-green-600 dark:text-green-300">{aadhaarMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {aadhaarVerificationStatus === 'error' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">{aadhaarMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAadhaarVerificationStatus('idle');
                    setAadhaarNumber('');
                    setOtp('');
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold"
                >
                  Try Again
                </button>
              </div>
            )}
          </section>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
          >
            Cancel
          </button>
          {!isReadOnly && (
            <>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="px-8 py-3 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('submitted')}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Now'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

// Helper Components for the Form
function FormField({ label, name, type = 'text', value, onChange, disabled, required, onFocus, placeholder, icon }: any) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label} {required && '*'}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          onFocus={onFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-11' : 'px-4'} py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 transition-all`}
        />
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, disabled }: any) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function FormCheckbox({ label, name, checked, onChange, disabled }: any) {
  return (
    <div className={`flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg transition-all ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'}`}>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange({ target: { name, value: e.target.checked, type: 'checkbox' } })}
        className="h-5 w-5 rounded text-blue-600 border-gray-300"
      />
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

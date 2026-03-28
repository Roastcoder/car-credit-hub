import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { paymentApplicationAPI, loansAPI } from '@/lib/api';
import { 
  Upload, FileText, Plus, X, Save, Send, 
  User, Building2, CreditCard, Calendar,
  AlertCircle, CheckCircle, Clock, Search, ChevronRight
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
  const { loanId, id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loanData, setLoanData] = useState<any>(null);
  const [pddDocuments, setPddDocuments] = useState<any[]>([]);
  const [selectedPddDocs, setSelectedPddDocs] = useState<string[]>([]);
  const [bankingDocs, setBankingDocs] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
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
    payment_in_favour_name: '',
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
    // Calculate Total Release and Percentages
    const oldAmt = Number(formData.old_release_amount) || 0;
    const todayAmt = Number(formData.today_release_amount) || 0;
    const totalAmt = oldAmt + todayAmt;
    const loanAmt = Number(formData.loan_amount) || 0;
    const holdAmt = Number(formData.hold_amount) || 0;

    const totalPerc = loanAmt > 0 ? (totalAmt / loanAmt) * 100 : 0;
    const holdPerc = loanAmt > 0 ? (holdAmt / loanAmt) * 100 : 0;

    setFormData(prev => ({
      ...prev,
      total_release_amount: totalAmt,
      total_release_percentage: parseFloat(totalPerc.toFixed(2)),
      hold_percentage: parseFloat(holdPerc.toFixed(2))
    }));
  }, [formData.old_release_amount, formData.today_release_amount, formData.loan_amount, formData.hold_amount]);

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
        financier_name: prev.financier_name || d.bank_name || d.financier_executive_name || '',
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
        foreclosure_name: prev.foreclosure_name || d.foreclosure_bank_name || '',
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
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePddDocumentToggle = (docIdentifier: string) => {
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
    const files = Array.from(e.target.files || []);
    setBankingDocs(prev => [...prev, ...files]);
  };

  const removeBankingDoc = (index: number) => {
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

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    try {
      setLoading(true);
      
      // Upload banking documents first
      const bankingDocPaths = await uploadBankingDocuments();
      
      const applicationData = {
        ...formData,
        banking_documents: [...(formData.banking_documents || []), ...bankingDocPaths],
        status
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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
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
        {/* 1. Customer Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <User className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. Customer Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField label="Customer Name" name="applicant_name" value={formData.applicant_name} onChange={handleInputChange} required />
            <FormField label="Loan Number" name="loan_number" value={formData.loan_number} onChange={handleInputChange} disabled />
            <FormField label="Mobile Number" name="applicant_phone" value={formData.applicant_phone} onChange={handleInputChange} required />
            <FormSelect label="KYC Documents" name="kyc_documents" value={formData.kyc_documents} onChange={handleInputChange} options={['Yes', 'No']} />
          </div>
        </section>

        {/* 2. Loan Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Building2 className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">2. Loan Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField label="Financier Name" name="financier_name" value={formData.financier_name} onChange={handleInputChange} />
            <FormField label="Loan Amount" name="loan_amount" type="number" value={formData.loan_amount} onChange={handleInputChange} />
            <FormField label="Disbursement Amount" name="disbursement_amount" type="number" value={formData.disbursement_amount} onChange={handleInputChange} />
            <FormField label="Disbursement Date" name="disbursement_date" type="date" value={formData.disbursement_date} onChange={handleInputChange} />
            <FormField label="Tenure (Months)" name="tenure_months" type="number" value={formData.tenure_months} onChange={handleInputChange} />
            <FormField label="EMI Amount" name="emi_amount" type="number" value={formData.emi_amount} onChange={handleInputChange} />
            <FormField label="EMI Mode" name="emi_mode" value={formData.emi_mode} onChange={handleInputChange} />
            <FormField label="IRR (%)" name="irr_percentage" type="number" value={formData.irr_percentage} onChange={handleInputChange} />
            <FormSelect label="Loan Type" name="loan_type" value={formData.loan_type} onChange={handleInputChange} options={['New', 'Refinance']} />
            <FormField label="File Booked Code" name="file_booked_code" value={formData.file_booked_code} onChange={handleInputChange} />
          </div>
        </section>

        {/* 3. Vehicle Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Upload className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. Vehicle Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField label="Vehicle Name" name="vehicle_name" value={formData.vehicle_name} onChange={handleInputChange} />
            <FormField label="Vehicle Model" name="vehicle_model" value={formData.vehicle_model} onChange={handleInputChange} />
            <FormField label="Vehicle Number" name="vehicle_number" value={formData.vehicle_number} onChange={handleInputChange} />
            <FormField label="Vehicle Type" name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} />
          </div>
        </section>

        {/* 4. Branch & Manager Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Building2 className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">4. Branch & Manager Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Our Branch" name="branch_name" value={formData.branch_name} onChange={handleInputChange} />
            <FormField label="Disbursement Branch" name="disbursement_branch" value={formData.disbursement_branch} onChange={handleInputChange} />
            <FormField label="Branch Manager Name" name="branch_manager_name" value={formData.branch_manager_name} onChange={handleInputChange} />
          </div>
        </section>

        {/* 5. RTO Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <FileText className="h-5 w-5 text-teal-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">5. RTO Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <FormField label="RTO Agent Name" name="rto_agent_name" value={formData.rto_agent_name} onChange={handleInputChange} />
            <FormField label="RTO Mobile Number" name="rto_mobile" value={formData.rto_mobile} onChange={handleInputChange} />
            <FormField label="DTO Location" name="dto_location" value={formData.dto_location} onChange={handleInputChange} />
            <FormField label="RTO Work" name="rto_work_type" value={formData.rto_work_type} onChange={handleInputChange} />
            <FormField label="RTO Document Location" name="rto_doc_location" value={formData.rto_doc_location} onChange={handleInputChange} />
          </div>
        </section>

        {/* 6. Document & Status Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">6. Document & Status Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormSelect label="RC Status" name="rc_status" value={formData.rc_status} onChange={handleInputChange} options={['Pending', 'OK']} />
            <FormSelect label="NOC Status" name="noc_status" value={formData.noc_status} onChange={handleInputChange} options={['Pending', 'OK']} />
            <FormField label="Checked By (NOC Status)" name="noc_checked_by" value={formData.noc_checked_by} onChange={handleInputChange} />
            <FormCheckbox label="Insurance Available" name="insurance_available" checked={formData.insurance_available} onChange={handleInputChange} />
            <FormCheckbox label="3rd Party Stamp" name="third_party_stamp" checked={formData.third_party_stamp} onChange={handleInputChange} />
            <FormCheckbox label="NOC Stamp" name="noc_stamp" checked={formData.noc_stamp} onChange={handleInputChange} />
            <FormCheckbox label="Third Party" name="is_third_party" checked={formData.is_third_party} onChange={handleInputChange} />
          </div>
        </section>

        {/* 7. Payment & Foreclosure Details */}
        <section className="glass-card p-6 rounded-xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <Plus className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">7. Payment & Foreclosure Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="Foreclosure Amount" name="foreclosure_amount" type="number" value={formData.foreclosure_amount} onChange={handleInputChange} />
            <FormField label="Foreclosure Name" name="foreclosure_name" value={formData.foreclosure_name} onChange={handleInputChange} />
            <FormField label="Old Payment Release Amount" name="old_release_amount" type="number" value={formData.old_release_amount} onChange={handleInputChange} />
            <FormField label="Today Payment Release Amount" name="today_release_amount" type="number" value={formData.today_release_amount} onChange={handleInputChange} />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Hold Amount" name="hold_amount" type="number" value={formData.hold_amount} onChange={handleInputChange} />
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
              <label className="text-xs font-semibold text-yellow-600 uppercase mb-1 block text-left">Hold Amount (%)</label>
              <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100 text-left">{formData.hold_percentage}%</p>
            </div>
            <FormField label="Challan Amount" name="challan_amount" type="number" value={formData.challan_amount} onChange={handleInputChange} />
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
            <FormField label="Payment In Favour (Beneficiary Name) *" name="payment_in_favour_name" value={formData.payment_in_favour_name} onChange={handleInputChange} required placeholder="Enter beneficiary name" />
            <FormField label="Bank Name *" name="bank_name" value={formData.bank_name} onChange={handleInputChange} required placeholder="Enter bank name" />
            <FormField label="Account Number *" name="account_number" value={formData.account_number} onChange={handleInputChange} required placeholder="Enter account number" />
            <FormField label="IFSC Code *" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} required placeholder="e.g. SBIN0001234" />
            <FormField label="Branch Name" name="branch_name" value={formData.branch_name} onChange={handleInputChange} placeholder="Enter branch name" />
            <FormCheckbox label="DM Approval" name="dm_approval" checked={formData.dm_approval} onChange={handleInputChange} />
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
                        className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
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
              <input type="file" id="banking-docs" multiple onChange={handleBankingDocUpload} className="hidden" />
              <label htmlFor="banking-docs" className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload size={20} className="mr-2 text-gray-400" />
                <span className="text-sm text-gray-500">Upload bank docs</span>
              </label>
              <div className="mt-2 space-y-1">
                {bankingDocs.map((file, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="truncate">{file.name}</span>
                    <X size={14} className="text-red-500 cursor-pointer" onClick={() => removeBankingDoc(i)} />
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Additional information..."
            />
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
          >
            Cancel
          </button>
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

function FormSelect({ label, name, value, onChange, options }: any) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function FormCheckbox({ label, name, checked, onChange }: any) {
  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={(e) => onChange({ target: { name, value: e.target.checked, type: 'checkbox' } })}
        className="h-5 w-5 rounded text-blue-600 border-gray-300"
      />
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

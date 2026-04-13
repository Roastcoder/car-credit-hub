import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, externalAPI, loansAPI, branchesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CAR_MAKES, VERTICALS, SCHEMES, LOAN_TYPES, INSURANCE_MADE_BY_OPTIONS, YES_NO_OPTIONS, FINANCIER_TEAM_VERTICAL_OPTIONS } from '@/lib/constants';
import { calculateEMI, formatCurrency, normalizeLoanNumberVertical } from '@/lib/utils';
import { getRolePermissions } from '@/lib/permissions';
import { ArrowLeft, Calculator, Search, X, AlertTriangle, Eye, List, ClipboardCheck, Plus, Trash2, FileText, Image as ImageIcon, Camera, Upload, CheckCircle2, Clock, MessageSquare, IndianRupee, User } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCommission, calculateAdvancedCommission } from '@/lib/schemes';
import MobilePageSwitcher from '@/components/MobilePageSwitcher';

const DocumentUploadCard = ({
  label,
  type,
  file,
  existingDoc,
  onChange,
  onClear
}: {
  label: string;
  type: string;
  file: File | null;
  existingDoc?: any;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (existingDoc?.file_url) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const normalizedPath = existingDoc.file_url.startsWith('/uploads') ? `/api${existingDoc.file_url}` : existingDoc.file_url;
      setPreview(existingDoc.file_url.startsWith('http') ? existingDoc.file_url : `${baseUrl}${normalizedPath}`);
    } else {
      setPreview(null);
    }
  }, [file, existingDoc]);

  const isImage = (url: string | null) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || url.startsWith('blob:');
  };

  return (
    <div className="group relative bg-card border border-border rounded-xl p-3 transition-all hover:shadow-md hover:border-accent/40">
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">{label}</h4>

        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30 border border-dashed border-border group-hover:border-accent/20 transition-colors flex items-center justify-center">
          {preview ? (
            isImage(preview) ? (
              <img src={preview} alt={label} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText size={32} className="text-accent/60" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase">PDF Document</span>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Camera size={24} className="text-muted-foreground/40" />
              <span className="text-[10px] font-medium text-muted-foreground/60">No Document</span>
            </div>
          )}

          {/* Status Badge */}
          {(file || existingDoc) && (
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/90 text-[9px] font-bold text-white shadow-lg backdrop-blur-sm">
                <CheckCircle2 size={10} /> {file ? 'NEW' : 'SAVED'}
              </span>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="p-2 bg-white text-black rounded-full cursor-pointer hover:bg-accent hover:text-white transition-all shadow-xl">
              <Upload size={16} />
              <input
                type="file"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
              />
            </label>
            {preview && (
              <button
                type="button"
                onClick={() => window.open(preview, '_blank')}
                className="p-2 bg-white text-black rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl"
              >
                <Eye size={16} />
              </button>
            )}
            {(file || existingDoc) && (
              <button
                type="button"
                onClick={onClear}
                className="p-2 bg-white text-black rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {!preview && (
          <label className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-border bg-background text-[10px] font-semibold hover:bg-muted transition-colors cursor-pointer text-muted-foreground">
            <Plus size={12} /> CHOOSE FILE
            <input
              type="file"
              className="hidden"
              onChange={(e) => onChange(e.target.files?.[0] || null)}
              accept="image/*,.pdf"
            />
          </label>
        )}

        {file && (
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[10px] text-accent font-medium truncate">✓ {file.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};


export default function CreateLoan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const isEditMode = !!id;
  const leadId = searchParams.get('leadId');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const permissions = getRolePermissions(user?.role || 'employee');
  const [activeStep, setActiveStep] = useState(0);

  const loanSwitcherOptions = [
    { label: 'Loans List', path: '/loans', icon: <List size={18} /> },
    { label: 'PDD Tracking', path: '/pdd-tracking', icon: <ClipboardCheck size={18} /> },
    { label: id ? 'Edit Loan' : 'New Loan', path: location.pathname, icon: <Plus size={18} /> },
  ];

  const [form, setForm] = useState(() => {
    const defaultState = {
      // Customer Details
      customerId: '', customerName: '', mobile: '', panNumber: '', aadharNumber: '', ourBranch: '',
      currentAddress: '', currentVillage: '', currentTehsil: '', currentDistrict: '', currentState: '', currentPincode: '',
      sameAsCurrentAddress: false,
      permanentAddress: '', permanentVillage: '', permanentTehsil: '', permanentDistrict: '', permanentState: '', permanentPincode: '',
      // Loan & Vehicle Details
      loanNumber: '', purposeLoanAmount: '', loanAmount: '', ltv: '', loanTypeVehicle: '',
      vehicleNumber: '', makerName: '', modelVariantName: '', mfgYear: '',
      chassisNumber: '', engineNumber: '',
      vertical: '', scheme: '', bookingMonth: '', branchManagerName: '',
      // Income Details
      incomeSource: '', monthlyIncome: '',
      // RTO Details
      rcOwnerName: '', rcMfgDate: '', rcExpiryDate: '', hpnAtLogin: '', isFinanced: '', newFinancier: '', rtoDocsHandoverDate: '',
      rtoAgentName: '', agentMobileNo: '', dtoLocation: '', rtoWorkDescription: '', challan: 'No', fc: 'No', rtoPapers: '',
      fcAmount: '', fcDate: '',
      // EMI Details
      irr: '', tenure: '60', emiAmount: '', emiMode: 'Monthly', emiStartDate: '', emiEndDate: '',
      // Financier Details
      assignedBankId: '', assignedBrokerId: '', bookingMode: 'self', financierExecutiveName: '', financierTeamVertical: '', disburseBranchName: '', sanctionAmount: '', sanctionDate: '',
      // Insurance Details
      insuranceCompanyName: '', premiumAmount: '', insuranceDate: '', insurancePolicyNumber: '', insuranceMadeBy: '', insuranceStatus: 'Pending', insuranceStartDate: '', insuranceReminderEnabled: true,
      // Deductions & Disbursement Details
      processingFee: '', netDisbursementAmount: '', paymentReceivedDate: '', meharDeduction: '', holdAmount: '', netSeedAmount: '', paymentInFavour: '',
      // Others
      loginDate: '', approvalDate: '', disbursementDate: '', sourcingPersonName: '', remark: '', fileStatus: 'submitted',
      // Documents
      aadharFront: null, aadharBack: null, panCard: null,
      bankStatement: null, cheque: null, rcFront: null, rcBack: null, incomeProof: null,
      customerPhoto: null, insurance: null, customerLedger: null,
      // Other KYC Documents
      rtoDocument: null, noc: null, thirdParty: null, stamp: null, rcDocument: null, fitnessDocument: null, taxReceipt: null, dmDocument: null,
      // Document checkboxes
      showAadhar: false, showPan: false, showBankStatement: false, showCheque: false,
      showRC: false, showIncomeProof: false, showCustomerPhoto: false, showInsurance: false, showCustomerLedger: false,
      // Other KYC checkboxes
      showRtoDocument: false, showNoc: false, showThirdParty: false, showStamp: false, showRcDocument: false, showFitnessDoc: false, showTaxReceipt: false, showDmDocument: false,
    };

    // Attempt to load from localStorage if we are not editing
    if (!id) {
      try {
        const savedDraft = localStorage.getItem('loan_form_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          // Files cannot be stored in localstorage effectively, so clear them
          return {
            ...defaultState,
            ...parsed,
            aadharFront: null, aadharBack: null, panCard: null,
            bankStatement: null, cheque: null, rcFront: null, rcBack: null, incomeProof: null,
            customerPhoto: null, insurance: null, customerLedger: null,
            rtoDocument: null, noc: null, thirdParty: null, stamp: null, rcDocument: null, fitnessDocument: null, taxReceipt: null, dmDocument: null,
          };
        }
      } catch (err) {
        console.error('Failed to load form draft from localstorage', err);
      }
    }

    return defaultState;
  });

  // Centralized Draft Saving Effect
  useEffect(() => {
    if (!id) { // Only save drafts for "New Loan" mode, not "Edit" mode
      const draftToSave = { ...form };
      // Remove file objects before saving to localStorage
      const fileKeys = [
        'aadharFront', 'aadharBack', 'panCard', 'bankStatement', 'cheque',
        'rcFront', 'rcBack', 'incomeProof', 'customerPhoto', 'insurance',
        'customerLedger', 'rtoDocument', 'noc', 'thirdParty', 'stamp',
        'rcDocument', 'fitnessDocument', 'taxReceipt', 'dmDocument'
      ];
      fileKeys.forEach(key => { delete (draftToSave as any)[key]; });

      localStorage.setItem('loan_form_draft', JSON.stringify(draftToSave));
    }
  }, [form, id]);

  if (!permissions.canCreateLoan && !id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-8">
          {user?.role === 'broker'
            ? 'Brokers are not allowed to create loan applications directly. Please create a Lead instead.'
            : 'You do not have permission to create new loan applications.'}
        </p>
        <button onClick={() => navigate('/loans')} className="px-6 py-2 rounded-lg bg-accent text-accent-foreground font-semibold">
          Back to Loans
        </button>
      </div>
    );
  }


  const { data: banks = [] } = useQuery({
    queryKey: ['banks-list'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/banks`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : (data.data || []);
      } catch {
        return [];
      }
    },
  });

  const { data: existingLoan, isLoading: loadingLoan } = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch loan');
      const data = await res.json();
      return data.data; // Unwrap the data
    },
    enabled: isEditMode,
  });

  const { data: existingDocuments = [] } = useQuery({
    queryKey: ['loan-documents', id],
    queryFn: async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/documents`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
      }
    },
    enabled: isEditMode && !!id,
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers-list'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/brokers`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : (data.data || []);
      } catch {
        return [];
      }
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-for-dropdown'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : (data.data || []);
      } catch {
        return [];
      }
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list'],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
  });

  const { data: leadToConvert } = useQuery({
    queryKey: ['lead-for-loan', leadId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/${leadId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch lead');
      const data = await response.json();
      return data?.data || data;
    },
    enabled: !!leadId && !isEditMode,
  });

  const { data: leadDocuments = [] } = useQuery({
    queryKey: ['lead-documents', leadId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/leads/${leadId}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!leadId && !isEditMode,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['loan-audit-logs', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/audit-logs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    },
    enabled: isEditMode && !!id,
  });

  const LOAN_STATUSES = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'sent_back', label: 'Sent Back' },
    { value: 'disbursed', label: 'Disbursed' },
    { value: 'pdd_pending', label: 'PDD Pending' },
    { value: 'pdd_submitted', label: 'PDD Submitted' },
    { value: 'pdd_approved', label: 'PDD Approved' },
    { value: 'completed', label: 'Completed' },
  ];

  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prefilledLeadRef = useRef<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLeadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLeads = useMemo(() => {
    if (!leadSearch || !leadSearch.trim()) return [];
    const search = leadSearch.toLowerCase();
    return leads.filter((l: any) =>
      l.customer_id?.toLowerCase().includes(search) ||
      l.customer_name?.toLowerCase().includes(search) ||
      l.phone_no?.includes(search)
    );
  }, [leads, leadSearch]);

  const [showOptionalFields, setShowOptionalFields] = useState({
    permanentAddress: false,
  });

  const [fetchingVehicleData, setFetchingVehicleData] = useState(false);
  const [challanData, setChallanData] = useState<any>(null);
  const [fetchingChallans, setFetchingChallans] = useState(false);

  const checkChallans = async () => {
    if (!form.vehicleNumber || !form.chassisNumber || !form.engineNumber) {
      toast.error('Vehicle number, Chassis number, and Engine number are required to check challans');
      return;
    }
    setFetchingChallans(true);
    try {
      const data = await externalAPI.fetchChallanData({
        rc_number: form.vehicleNumber,
        chassis_number: form.chassisNumber,
        engine_number: form.engineNumber,
      });
      setChallanData(data.data?.challan_details || data.challan_details || data);
      const challans = data.data?.challan_details?.challans || [];
      const pending = challans.filter((c: any) => c.challan_status === 'Pending');
      if (pending.length > 0) {
        const total = pending.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
        toast.warning(`${pending.length} pending challan(s) found. Total: ₹${total.toLocaleString()}`);
      } else if (challans.length === 0) {
        toast.success('No challans found for this vehicle');
      } else {
        toast.info(`${challans.length} challan(s) found (all cleared)`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch challan details');
    } finally {
      setFetchingChallans(false);
    }
  };

  const formatDateToInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      // If already in yyyy-MM-dd format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Parse and convert to yyyy-MM-dd
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const getTenureFromDates = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

    return ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth()) + 1;
  };

  const fetchVehicleDetails = async (rcNumber: string) => {
    if (!rcNumber || rcNumber.length < 8) return;

    setFetchingVehicleData(true);
    try {
      toast.info('Fetching vehicle details...');

      const rcData = await externalAPI.fetchRCFullData(rcNumber);

      if (rcData.success && rcData.data) {
        const rc = rcData.data;

        setForm(f => ({
          ...f,
          // Vehicle Details
          makerName: rc.maker_description || rc.maker_model || rc.vehicle_manufacturer_name || rc.manufacturer || rc.make || '',
          modelVariantName: rc.maker_model || rc.model || rc.vehicle_model || rc.variant || rc.model_name || rc.vehicle_class || '',
          mfgYear: rc.manufacturing_date_formatted?.split('-')[0] || rc.manufacturing_date?.split('-')[0] || rc.registration_date?.split('-')[0] || rc.mfg_year || rc.year || rc.manufacturing_year || rc.model_year || '',
          chassisNumber: rc.vehicle_chasi_number || rc.chassis_number || '',
          engineNumber: rc.vehicle_engine_number || rc.engine_number || '',

          // RC/RTO Details  
          rcOwnerName: rc.owner_name || '',
          rcMfgDate: formatDateToInput(rc.manufacturing_date_formatted || rc.manufacturing_date || rc.registration_date),
          rcExpiryDate: formatDateToInput(rc.fit_up_to || rc.fitness_upto || rc.tax_upto || rc.tax_paid_upto),
          hpnAtLogin: rc.financer ? (rc.financer || 'Financed') : 'Not Financed',
          isFinanced: rc.financer ? 'Yes' : 'No',
          fc: (rc.fit_up_to || rc.fitness_upto) ? 'Yes' : 'No',
          customerName: f.customerName || rc.owner_name || '',
          mobile: f.mobile || rc.mobile_number || '',
          fatherName: rc.father_name || f.fatherName || '',

          // Address from RC (only if empty)
          currentAddress: f.currentAddress || rc.present_address || rc.permanent_address || '',
          permanentAddress: f.permanentAddress || rc.permanent_address || '',
          currentPincode: f.currentPincode || rc.present_address?.match(/\d{6}/)?.[0] || rc.permanent_address?.match(/\d{6}/)?.[0] || '',
          permanentPincode: f.permanentPincode || rc.permanent_address?.match(/\d{6}/)?.[0] || '',

          // Insurance Details
          insuranceCompanyName: rc.insurance_company || '',
          insurancePolicyNumber: rc.insurance_policy_number || '',
          insuranceDate: formatDateToInput(rc.insurance_upto),
        }));

        toast.success(`Vehicle details fetched for ${rc.owner_name || 'owner'}`);
      } else {
        toast.error(rcData.message || 'Could not fetch vehicle details');
      }
    } catch (error: any) {
      console.error('Error fetching vehicle details:', error);
      toast.error(error.message || 'Failed to fetch vehicle details');
    } finally {
      setFetchingVehicleData(false);
    }
  };

  const [customTenure, setCustomTenure] = useState('');
  const [showCustomTenure, setShowCustomTenure] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const tenureOptions = [12, 18, 24, 36, 48, 60, 72, 84];

  const handleTenureChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomTenure(true);
      setCustomTenure('');
    } else {
      setShowCustomTenure(false);
      setCustomTenure('');
      update('tenure', value);
    }
  };

  const handleCustomTenureChange = (value: string) => {
    setCustomTenure(value);
    if (value && !isNaN(Number(value)) && Number(value) > 0) {
      update('tenure', value);
    }
  };

  useEffect(() => {
    if (isEditMode && existingLoan) {
      // Helper function to format date from ISO to yyyy-MM-dd
      const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      setForm({
        customerId: existingLoan.customer_id || '',
        customerName: existingLoan.applicant_name || '',
        mobile: existingLoan.mobile || '',
        panNumber: existingLoan.pan_number || '',
        aadharNumber: existingLoan.aadhar_number || '',
        ourBranch: existingLoan.our_branch || '',
        currentAddress: existingLoan.current_address || '',
        currentVillage: existingLoan.current_village || '',
        currentTehsil: existingLoan.current_tehsil || '',
        currentDistrict: existingLoan.current_district || '',
        currentState: existingLoan.current_state || '',
        currentPincode: existingLoan.current_pincode || '',
        sameAsCurrentAddress: false,
        permanentAddress: existingLoan.permanent_address || '',
        permanentVillage: existingLoan.permanent_village || '',
        permanentTehsil: existingLoan.permanent_tehsil || '',
        permanentDistrict: existingLoan.permanent_district || '',
        permanentState: existingLoan.permanent_state || '',
        permanentPincode: existingLoan.permanent_pincode || '',
        loanNumber: existingLoan.loan_number || '',
        purposeLoanAmount: existingLoan.purpose_loan_amount || '',
        loanAmount: String(existingLoan.loan_amount || ''),
        ltv: String(existingLoan.ltv || ''),
        loanTypeVehicle: existingLoan.loan_type_vehicle || '',
        vehicleNumber: existingLoan.vehicle_number || '',
        makerName: existingLoan.maker_name || '',
        modelVariantName: existingLoan.model_variant_name || '',
        mfgYear: existingLoan.mfg_year || '',
        chassisNumber: existingLoan.chassis_number || '',
        engineNumber: existingLoan.engine_number || '',
        vertical: existingLoan.vertical || '',
        scheme: existingLoan.scheme || '',
        bookingMonth: existingLoan.booking_month || '',
        branchManagerName: existingLoan.manager_name || existingLoan.branch_manager_name || '',
        incomeSource: existingLoan.income_source || '',
        monthlyIncome: String(existingLoan.monthly_income || ''),
        rcOwnerName: existingLoan.rc_owner_name || '',
        rcMfgDate: formatDate(existingLoan.rc_mfg_date),
        rcExpiryDate: formatDate(existingLoan.rc_expiry_date),
        hpnAtLogin: existingLoan.hpn_at_login || '',
        isFinanced: existingLoan.is_financed || '',
        newFinancier: existingLoan.new_financier || '',
        rtoDocsHandoverDate: formatDate(existingLoan.rto_docs_handover_date),
        rtoAgentName: existingLoan.rto_agent_name || '',
        agentMobileNo: existingLoan.agent_mobile_no || '',
        dtoLocation: existingLoan.dto_location || '',
        rtoWorkDescription: existingLoan.rto_work_description || '',
        challan: existingLoan.challan || 'No',
        fc: existingLoan.fc || 'No',
        rtoPapers: existingLoan.rto_papers || '',
        irr: String(existingLoan.irr || existingLoan.interest_rate || ''),
        tenure: String(existingLoan.tenure || '60'),
        emiAmount: String(existingLoan.emi || existingLoan.emi_amount || ''),
        emiMode: existingLoan.emi_mode || 'Monthly',
        emiStartDate: formatDate(existingLoan.emi_start_date),
        emiEndDate: formatDate(existingLoan.emi_end_date),
        assignedBankId: existingLoan.assigned_bank_id || '',
        assignedBrokerId: existingLoan.assigned_broker_id || '',
        bookingMode: existingLoan.assigned_broker_id ? 'broker' : (existingLoan.booking_mode || 'self'),
        financierExecutiveName: existingLoan.financier_executive_name || '',
        financierTeamVertical: existingLoan.financier_team_vertical || '',
        disburseBranchName: existingLoan.disburse_branch_name || '',
        sanctionAmount: String(existingLoan.sanction_amount || ''),
        sanctionDate: formatDate(existingLoan.sanction_date),
        insuranceCompanyName: existingLoan.insurance_company_name || '',
        premiumAmount: String(existingLoan.premium_amount || ''),
        insuranceDate: formatDate(existingLoan.insurance_date),
        insuranceStartDate: formatDate(existingLoan.insurance_start_date),
        insurancePolicyNumber: existingLoan.insurance_policy_number || '',
        insuranceMadeBy: existingLoan.insurance_made_by || '',
        insuranceStatus: existingLoan.insurance_status || 'Pending',
        insuranceReminderEnabled: existingLoan.insurance_reminder_enabled || false,
        processingFee: String(existingLoan.processing_fee || ''),
        netDisbursementAmount: String(existingLoan.net_disbursement_amount || ''),
        paymentReceivedDate: formatDate(existingLoan.payment_received_date),
        meharDeduction: String(existingLoan.mehar_deduction || ''),
        holdAmount: String(existingLoan.hold_amount || ''),
        netSeedAmount: String(existingLoan.net_seed_amount || ''),
        paymentInFavour: existingLoan.payment_in_favour || '',
        loginDate: formatDate(existingLoan.login_date),
        approvalDate: formatDate(existingLoan.approval_date),
        disbursementDate: formatDate(existingLoan.disbursement_date),
        sourcingPersonName: existingLoan.sourcing_person_name || '',
        remark: existingLoan.remark || '',
        fileStatus: existingLoan.status || 'submitted',
        fcAmount: String(existingLoan.fc_amount || ''),
        fcDate: formatDate(existingLoan.fc_date),
        aadharFront: null, aadharBack: null, panCard: null,
        bankStatement: null, cheque: null, rcFront: null, rcBack: null, incomeProof: null,
        customerPhoto: null, insurance: null, customerLedger: null,
        rtoDocument: null, noc: null, thirdParty: null, stamp: null, rcDocument: null, fitnessDocument: null, taxReceipt: null, dmDocument: null,
        showAadhar: false, showPan: false, showBankStatement: false, showCheque: false,
        showRC: false, showIncomeProof: false, showCustomerPhoto: false, showInsurance: false, showCustomerLedger: false,
        showRtoDocument: false, showNoc: false, showThirdParty: false, showStamp: false, showRcDocument: false, showFitnessDoc: false, showTaxReceipt: false, showDmDocument: false,
      });

      // Handle custom tenure for edit mode
      const existingTenure = String(existingLoan.tenure || '60');
      if (!tenureOptions.includes(Number(existingTenure))) {
        setShowCustomTenure(true);
        setCustomTenure(existingTenure);
      }
    }
  }, [isEditMode, existingLoan]);

  useEffect(() => {
    if (isEditMode && existingDocuments.length > 0) {
      setUploadedDocs(existingDocuments);

      // Auto-enable visibility checkboxes based on existing documents
      setForm(f => {
        const newForm = { ...f };
        existingDocuments.forEach((doc: any) => {
          switch (doc.document_type) {
            case 'aadhar_front':
            case 'aadhar_back':
              newForm.showAadhar = true;
              break;
            case 'pan_card':
              newForm.showPan = true;
              break;
            case 'bank_statement':
              newForm.showBankStatement = true;
              break;
            case 'cheque':
              newForm.showCheque = true;
              break;
            case 'rc_front':
            case 'rc_back':
              newForm.showRC = true;
              break;
            case 'income_proof':
              newForm.showIncomeProof = true;
              break;
            case 'customer_photo':
              newForm.showCustomerPhoto = true;
              break;
            case 'insurance':
              newForm.showInsurance = true;
              break;
            case 'customer_ledger':
              newForm.showCustomerLedger = true;
              break;
            case 'rto_document':
              newForm.showRtoDocument = true;
              break;
            case 'noc':
              newForm.showNoc = true;
              break;
            case 'third_party':
              newForm.showThirdParty = true;
              break;
            case 'stamp':
              newForm.showStamp = true;
              break;
            case 'rc_document':
              newForm.showRcDocument = true;
              break;
            case 'fitness_document':
              newForm.showFitnessDoc = true;
              break;
            case 'tax_receipt':
              newForm.showTaxReceipt = true;
              break;
            case 'dm_document':
              newForm.showDmDocument = true;
              break;
          }
        });
        return newForm;
      });
    }
  }, [isEditMode, existingDocuments]);

  const update = (key: string, val: string | File | null | boolean) => {
    setForm(f => {
      const newForm = { ...f, [key]: val };
      if (key === 'bookingMode' && val === 'self') {
        newForm.assignedBrokerId = '';
      }
      return newForm;
    });
  };

  const handleLeadSelect = (lead: any) => {
    setForm(f => ({
      ...f,
      customerId: lead.customer_id || '',
      customerName: lead.customer_name || '',
      mobile: lead.phone_no || lead.mobile || '',
      panNumber: lead.pan_number || lead.pan_no || lead.pan_card || '',
      aadharNumber: lead.aadhar_number || lead.aadhar_no || lead.aadhar_card || '',
      currentAddress: lead.address || '',
      currentTehsil: lead.tehsil || '',
      currentDistrict: lead.district || '',
      currentPincode: lead.pin_code || '',
      vehicleNumber: lead.vehicle_no || '',
      purposeLoanAmount: lead.loan_amount_required ? String(lead.loan_amount_required) : '',
      irr: lead.irr_requested ? String(lead.irr_requested) : '',
      sourcingPersonName: lead.referred_by_name || lead.sourcing_person_name || '',
      ourBranch: lead.our_branch || '',
      fcAmount: '',
      fcDate: '',
    }));

    // Auto-fetch vehicle details if RC number exists
    if (lead.vehicle_no && lead.vehicle_no.length >= 8) {
      fetchVehicleDetails(lead.vehicle_no);
    }
  };

  useEffect(() => {
    if (!leadToConvert || isEditMode || !leadId || prefilledLeadRef.current === leadId) return;

    handleLeadSelect(leadToConvert);

    // Populate documents from lead
    if (leadDocuments && leadDocuments.length > 0) {
      setUploadedDocs(leadDocuments);
      
      setForm(f => {
        const newForm = { ...f };
        leadDocuments.forEach((doc: any) => {
          switch (doc.document_type) {
            case 'aadhar_front':
            case 'aadhar_back':
              newForm.showAadhar = true;
              break;
            case 'pan_card':
              newForm.showPan = true;
              break;
            case 'bank_statement':
              newForm.showBankStatement = true;
              break;
            case 'cheque':
              newForm.showCheque = true;
              break;
            case 'rc_front':
            case 'rc_back':
              newForm.showRC = true;
              break;
            case 'income_proof':
              newForm.showIncomeProof = true;
              break;
            case 'customer_photo':
              newForm.showCustomerPhoto = true;
              break;
            case 'insurance':
              newForm.showInsurance = true;
              break;
            // Add other KYC mappings as needed
          }
        });
        return newForm;
      });
    }

    setLeadSearch(leadToConvert.customer_id || '');
    prefilledLeadRef.current = leadId;
  }, [leadId, leadToConvert, leadDocuments, isEditMode]);

  const handleSameAddress = (checked: boolean) => {
    setForm(f => ({
      ...f,
      sameAsCurrentAddress: checked,
      ...(checked ? {
        permanentAddress: f.currentAddress,
        permanentVillage: f.currentVillage,
        permanentTehsil: f.currentTehsil,
        permanentDistrict: f.currentDistrict,
        permanentState: f.currentState,
        permanentPincode: f.currentPincode,
      } : {})
    }));
  };

  const calculatedTenure = useMemo(() => {
    return getTenureFromDates(form.emiStartDate, form.emiEndDate) || Number(form.tenure) || 0;
  }, [form.emiEndDate, form.emiStartDate, form.tenure]);

  // Auto-calculate EMI End Date when Start Date or Tenure changes
  useEffect(() => {
    if (form.emiStartDate && form.tenure && !isNaN(Number(form.tenure))) {
      try {
        const start = new Date(form.emiStartDate);
        if (isNaN(start.getTime())) return;

        const months = Number(form.tenure);
        if (months <= 0) return;

        const end = new Date(start);
        // Standard calculation: Start Date + Tenure months - 1 day/month
        // e.g., Jan 1st for 12 months ends on Dec 1st
        end.setMonth(end.getMonth() + months - 1);

        const formattedEnd = end.toISOString().split('T')[0];
        if (form.emiEndDate !== formattedEnd) {
          update('emiEndDate', formattedEnd);
        }
      } catch (error) {
        console.error('Error calculating EMI end date:', error);
      }
    }
  }, [form.emiStartDate, form.tenure]);

  // Auto-fill Branch Manager Name based on selected branch
  useEffect(() => {
    if (form.ourBranch && branches.length > 0) {
      const selectedBranch = branches.find((b: any) => b.name === form.ourBranch);
      if (selectedBranch && selectedBranch.manager_name && form.branchManagerName !== selectedBranch.manager_name) {
        update('branchManagerName', selectedBranch.manager_name);
      }
    }
  }, [form.ourBranch, branches]);

  // Auto-calculate Total Deduction from Financer (Processing Fee)
  useEffect(() => {
    const proposed = Number(form.purposeLoanAmount) || 0;
    const net = Number(form.netDisbursementAmount) || 0;
    if (proposed > 0 || net > 0) {
      const deduction = proposed - net;
      if (deduction !== Number(form.processingFee)) {
        update('processingFee', String(deduction));
      }
    }
  }, [form.purposeLoanAmount, form.netDisbursementAmount]);

  // Auto-fill Our Branch from logged-in user's branch
  useEffect(() => {
    if (!isEditMode && user && branches.length > 0 && !form.ourBranch) {
      // If user object has branch_name, use it; otherwise look up by branch_id
      const branchName = (user as any).branch_name || branches.find((b: any) => String(b.id) === String(user.branch_id))?.name;
      if (branchName) {
        update('ourBranch', branchName);
      }
    }
  }, [user, branches, isEditMode]);

  const emi = useMemo(() => {
    const p = Number(form.loanAmount);
    const r = Number(form.irr);
    const t = calculatedTenure;
    const mode = form.emiMode || 'Monthly';
    if (p > 0 && r > 0 && t > 0) return calculateEMI(p, r, t, mode);
    return 0;
  }, [form.loanAmount, form.irr, calculatedTenure, form.emiMode]);

  const totalPayable = useMemo(() => {
    const t = calculatedTenure;
    const mode = form.emiMode || 'Monthly';
    let periods = t;
    if (mode === 'Quarterly') periods = t / 3;
    else if (mode === 'Half Yearly') periods = t / 6;
    else if (mode === 'Yearly') periods = t / 12;

    return emi * periods;
  }, [emi, calculatedTenure, form.emiMode]);

  const computedCommission = useMemo(() => {
    const financierName = (banks as any[]).find((b: any) => String(b.id) === String(form.assignedBankId))?.name || '';
    return calculateAdvancedCommission(financierName, form.vertical, Number(form.loanAmount) || 0, calculatedTenure);
  }, [form.assignedBankId, form.vertical, form.loanAmount, calculatedTenure, banks]);

  const totalInterest = totalPayable - Number(form.loanAmount);
  const effectiveVertical = normalizeLoanNumberVertical(form.financierTeamVertical || form.vertical) || '';

  const uploadDocuments = async (loanId: string) => {
    const documents = [
      { file: form.aadharFront, type: 'aadhar_front', name: 'Aadhar Front' },
      { file: form.aadharBack, type: 'aadhar_back', name: 'Aadhar Back' },
      { file: form.panCard, type: 'pan_card', name: 'PAN Card' },
      { file: form.bankStatement, type: 'bank_statement', name: 'Bank Statement' },
      { file: form.cheque, type: 'cheque', name: 'Cheque' },
      { file: form.rcFront, type: 'rc_front', name: 'RC Front' },
      { file: form.rcBack, type: 'rc_back', name: 'RC Back' },
      { file: form.incomeProof, type: 'income_proof', name: 'Income Proof' },
      { file: form.customerPhoto, type: 'customer_photo', name: 'Customer Photo' },
      { file: form.insurance, type: 'insurance', name: 'Insurance' },
      { file: form.customerLedger, type: 'customer_ledger', name: 'Customer Ledger' },
      { file: form.rtoDocument, type: 'rto_document', name: 'RTO Document' },
      { file: form.noc, type: 'noc', name: 'NOC' },
      { file: form.thirdParty, type: 'third_party', name: 'Third Party' },
      { file: form.stamp, type: 'stamp', name: 'Stamp' },
      { file: form.rcDocument, type: 'rc_document', name: 'RC Document' },
      { file: form.fitnessDocument, type: 'fitness_document', name: 'FC' },
      { file: form.taxReceipt, type: 'tax_receipt', name: 'RBM / Tax Receipt' },
      { file: form.dmDocument, type: 'dm_document', name: 'DM' },
    ].filter(doc => doc.file !== null);

    if (documents.length === 0) {
      return;
    }

    setUploadingDocs(true);

    try {
      const formData = new FormData();

      // Append all files with their field names
      documents.forEach(doc => {
        formData.append(doc.type, doc.file as File);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${loanId}/documents/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedDocs(prev => {
          const nextDocs = Array.isArray(result.uploaded) ? result.uploaded : [];
          const merged = [...prev];

          for (const doc of nextDocs) {
            const existingIndex = merged.findIndex(existing => existing.id === doc.id);
            if (existingIndex >= 0) {
              merged[existingIndex] = doc;
            } else {
              merged.push(doc);
            }
          }

          return merged;
        });
        if (isEditMode && id) {
          queryClient.invalidateQueries({ queryKey: ['loan-documents', id] });
        }
        toast.success(result.message || `${documents.length} document(s) uploaded successfully`);
      } else {
        const error = await response.text();
        console.error('Upload failed:', error);
        toast.error('Failed to upload documents');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading documents');
    } finally {
      setUploadingDocs(false);
    }
  };

  const deleteDocument = useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete document');
      }
      return res.json();
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['loan-documents', id] });
      }
      if (docToDelete) {
        setUploadedDocs(prev => prev.filter(d => d.id !== docToDelete.id));
      }
      toast.success('Document deleted successfully');
      setShowDeleteDocModal(false);
      setDocToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error deleting document');
    }
  });

  const handleClearDocument = (field: string, existingDoc?: any) => {
    if (existingDoc && isEditMode) {
      setDocToDelete(existingDoc);
      setShowDeleteDocModal(true);
    } else {
      update(field, null);
    }
  };

  const createLoan = useMutation({
    mutationFn: async () => {
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans/${id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/loans`;

      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          lead_id: leadId ? Number(leadId) : null,
          customer_id: form.customerId || null,
          applicant_name: form.customerName,
          mobile: form.mobile,
          pan_number: form.panNumber?.trim() || null,
          aadhar_number: form.aadharNumber?.trim() || null,
          our_branch: form.ourBranch || null,
          current_address: form.currentAddress || null,
          current_village: form.currentVillage || null,
          current_tehsil: form.currentTehsil || null,
          current_district: form.currentDistrict || null,
          current_pincode: form.currentPincode || null,
          permanent_address: form.permanentAddress || null,
          permanent_village: form.permanentVillage || null,
          permanent_tehsil: form.permanentTehsil || null,
          permanent_district: form.permanentDistrict || null,
          permanent_pincode: form.permanentPincode || null,
          income_source: form.incomeSource || null,
          monthly_income: Number(form.monthlyIncome) || null,
          loan_amount: Number(form.loanAmount) || 0,
          ltv: Number(form.ltv) || null,
          loan_type_vehicle: form.loanTypeVehicle || null,
          vehicle_number: form.vehicleNumber || null,
          maker_name: form.makerName || null,
          model_variant_name: form.modelVariantName || null,
          mfg_year: form.mfgYear || null,
          chassis_number: form.chassisNumber || null,
          engine_number: form.engineNumber || null,
          vertical: form.vertical || effectiveVertical || null,
          scheme: form.scheme || null,
          emi_amount: Number(form.emiAmount) || emi || null,
          total_emi: calculatedTenure || null,
          total_interest: (totalInterest > 0 ? totalInterest : null),
          irr: Number(form.irr) || null,
          tenure: calculatedTenure || 60,
          emi_start_date: form.emiStartDate || null,
          emi_end_date: form.emiEndDate || null,
          processing_fee: Number(form.processingFee) || null,
          emi: Number(form.emiAmount) || emi || null,
          interest_rate: Number(form.irr) || null,
          assigned_bank_id: form.assignedBankId || null,
          assigned_broker_id: form.bookingMode === 'broker' ? (form.assignedBrokerId || null) : null,
          booking_mode: form.bookingMode,
          sanction_amount: Number(form.sanctionAmount) || null,
          sanction_date: form.sanctionDate || null,
          insurance_company_name: form.insuranceCompanyName || null,
          premium_amount: Number(form.premiumAmount) || null,
          insurance_date: form.insuranceDate || null,
          insurance_policy_number: form.insurancePolicyNumber || null,
          insurance_made_by: form.insuranceMadeBy || null,
          insurance_reminder_enabled: form.insuranceReminderEnabled || false,
          mehar_deduction: Number(form.meharDeduction) || null,
          hold_amount: Number(form.holdAmount) || null,
          net_seed_amount: Number(form.netSeedAmount) || null,
          payment_in_favour: form.paymentInFavour || null,
          net_disbursement_amount: Number(form.netDisbursementAmount) || null,
          payment_received_date: form.paymentReceivedDate || null,
          rc_owner_name: form.rcOwnerName || null,
          rto_agent_name: form.rtoAgentName || null,
          agent_mobile_no: form.agentMobileNo || null,
          login_date: form.loginDate || null,
          approval_date: form.approvalDate || null,
          disbursement_date: form.disbursementDate || null,
          sourcing_person_name: form.sourcingPersonName || null,
          remark: form.remark || null,
          status: (form.fileStatus === 'draft' ? 'submitted' : form.fileStatus) || 'submitted',
          created_by: user?.id,
          // Newly Synced Fields
          current_state: form.currentState || null,
          permanent_state: form.permanentState || null,
          purpose_loan_amount: Number(form.purposeLoanAmount) || null,
          emi_mode: form.emiMode || 'Monthly',
          financier_executive_name: form.financierExecutiveName || null,
          financier_team_vertical: effectiveVertical || null,
          disburse_branch_name: form.disburseBranchName || null,
          hpn_at_login: form.hpnAtLogin || null,
          is_financed: form.isFinanced || null,
          fc: form.fc || null,
          rc_mfg_date: form.rcMfgDate || null,
          rc_expiry_date: form.rcExpiryDate || null,
          challan_status: form.challan,
          rto_papers: form.rtoPapers,
          fc_amount: Number(form.fcAmount) || null,
          fc_date: form.fcDate || null,
          booking_month: form.bookingMonth || null,
          manager_name: form.branchManagerName || null,
          insurance_status: form.insuranceStatus || null,
          insurance_start_date: form.insuranceStartDate || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create loan');
      const data = await res.json();

      // Upload documents after loan is created
      await uploadDocuments(isEditMode ? id! : data.id);

      // Create commission if matched
      if (computedCommission.amount > 0 && form.assignedBrokerId && !isEditMode) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/commissions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({
              loan_id: data.id,
              broker_id: form.assignedBrokerId,
              commission_amount: computedCommission.amount,
              commission_rate: computedCommission.rate,
              commission_type: 'broker',
              status: 'pending'
            })
          });
        } catch (e) {
          console.error('Failed to create commission automatically', e);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      localStorage.removeItem('loan_form_draft');
      toast.success(isEditMode ? 'Loan application updated successfully!' : 'Loan application created successfully!');
      navigate(`/loans/${isEditMode ? id : data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} loan`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.mobile.trim() || !form.loanAmount) {
      toast.error('Customer Name, Mobile, and Loan Amount are required');
      return;
    }
    createLoan.mutate();
  };

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all";
  const labelClass = "block text-xs font-medium text-foreground/70 mb-1.5";

  return (
    <div className="w-full mx-auto px-4 pb-20 lg:pb-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground mb-2">{isEditMode ? 'Edit Loan Application' : 'New Loan Application'}</h1>
      </div>

      {loadingLoan && isEditMode ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading loan details...</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-5 shadow-sm space-y-8">
                {/* Customer Details */}
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-4">Customer Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative" ref={dropdownRef}>
                      <label className={labelClass}>Customer ID</label>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                          value={leadSearch || form.customerId}
                          onChange={(e) => {
                            const value = e.target.value;
                            setLeadSearch(value);
                            setForm(f => ({ ...f, customerId: value }));
                            setShowLeadDropdown(true);
                          }}
                          onFocus={() => setShowLeadDropdown(true)}
                          placeholder="Search by ID, name or phone..."
                        />
                        {leadSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setLeadSearch('');
                              setForm(f => ({ ...f, customerId: '' }));
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {showLeadDropdown && filteredLeads.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredLeads.slice(0, 10).map((l: any) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                handleLeadSelect(l);
                                setLeadSearch(l.customer_id);
                                setShowLeadDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                            >
                              <div className="font-medium text-foreground text-sm flex items-center justify-between">
                                <span>{l.customer_name}</span>
                                {(l.pan_number || l.aadhar_number) && (
                                  <div className="flex gap-1.5">
                                    {l.pan_number && <span className="bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded text-[10px] border border-blue-500/20">PAN: {l.pan_number}</span>}
                                    {l.aadhar_number && <span className="bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded text-[10px] border border-purple-500/20">AADHAAR: {l.aadhar_number}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                                <div><span className="font-mono text-accent">{l.customer_id}</span> • {l.phone_no}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div><label className={labelClass}>Customer Name *</label><input required className={inputClass} value={form.customerName} onChange={e => update('customerName', e.target.value)} /></div>
                    <div><label className={labelClass}>Mobile No *</label><input required className={inputClass} value={form.mobile} onChange={e => update('mobile', e.target.value)} maxLength={10} /></div>
                    <div><label className={labelClass}>PAN Number</label><input className={inputClass} value={form.panNumber} onChange={e => update('panNumber', e.target.value)} maxLength={10} placeholder="e.g. ABCDE1234F" /></div>
                    <div><label className={labelClass}>Aadhaar Number</label><input className={inputClass} value={form.aadharNumber} onChange={e => update('aadharNumber', e.target.value)} maxLength={12} placeholder="e.g. 1234 5678 9012" /></div>
                    <div>
                      <label className={labelClass}>Our Branch</label>
                      <input
                        className={inputClass}
                        value={form.ourBranch}
                        onChange={e => update('ourBranch', e.target.value)}
                        list="branches-datalist"
                      />
                      <datalist id="branches-datalist">
                        {branches.map((b: any) => (
                          <option key={b.id} value={b.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className={labelClass}>Branch Manager Name</label>
                      <input
                        className={inputClass}
                        value={form.branchManagerName}
                        onChange={e => update('branchManagerName', e.target.value)}
                        readOnly
                      />
                    </div>
                    <div><label className={labelClass}>Booking Month</label><input className={inputClass} value={form.bookingMonth} onChange={e => update('bookingMonth', e.target.value)} placeholder="e.g. April 2024" /></div>

                    <div className="md:col-span-3 mt-6"><h3 className="font-semibold text-foreground mb-3">Current Address</h3></div>
                    <div className="md:col-span-3"><label className={labelClass}>Address</label><textarea className={inputClass} rows={2} value={form.currentAddress} onChange={e => update('currentAddress', e.target.value)} /></div>
                    <div><label className={labelClass}>Village</label><input className={inputClass} value={form.currentVillage} onChange={e => update('currentVillage', e.target.value)} /></div>
                    <div><label className={labelClass}>Tehsil</label><input className={inputClass} value={form.currentTehsil} onChange={e => update('currentTehsil', e.target.value)} /></div>
                    <div><label className={labelClass}>District</label><input className={inputClass} value={form.currentDistrict} onChange={e => update('currentDistrict', e.target.value)} /></div>
                    <div><label className={labelClass}>State</label><input className={inputClass} value={form.currentState} onChange={e => update('currentState', e.target.value)} /></div>
                    <div><label className={labelClass}>Pincode</label><input className={inputClass} value={form.currentPincode} onChange={e => update('currentPincode', e.target.value)} maxLength={6} /></div>
                    <div className="md:col-span-3 mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.sameAsCurrentAddress} onChange={e => handleSameAddress(e.target.checked)} className="w-4 h-4 rounded border-border" />
                        <span className="text-sm font-medium text-foreground">Same As Current Address</span>
                      </label>
                    </div>
                    {!form.sameAsCurrentAddress && (
                      <>
                        <div className="md:col-span-3"><h3 className="font-semibold text-foreground mb-3">Permanent Address</h3></div>
                        <div className="md:col-span-3"><label className={labelClass}>Address</label><textarea className={inputClass} rows={2} value={form.permanentAddress} onChange={e => update('permanentAddress', e.target.value)} /></div>
                        <div><label className={labelClass}>Village</label><input className={inputClass} value={form.permanentVillage} onChange={e => update('permanentVillage', e.target.value)} /></div>
                        <div><label className={labelClass}>Tehsil</label><input className={inputClass} value={form.permanentTehsil} onChange={e => update('permanentTehsil', e.target.value)} /></div>
                        <div><label className={labelClass}>District</label><input className={inputClass} value={form.permanentDistrict} onChange={e => update('permanentDistrict', e.target.value)} /></div>
                        <div><label className={labelClass}>State</label><input className={inputClass} value={form.permanentState} onChange={e => update('permanentState', e.target.value)} /></div>
                        <div><label className={labelClass}>Pincode</label><input className={inputClass} value={form.permanentPincode} onChange={e => update('permanentPincode', e.target.value)} maxLength={6} /></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── SECTION 2: Vehicle, Insurance & RTO Details ─── */}
              <div className="bg-card rounded-lg border border-border p-5 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">2</span>
                  Vehicle, Insurance & RTO Details
                </h2>

                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className={labelClass}>Vehicle Reg. No</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          className={inputClass}
                          value={form.vehicleNumber}
                          onChange={e => {
                            const value = e.target.value.toUpperCase();
                            update('vehicleNumber', value);
                          }}
                          placeholder="e.g., RJ60SW9525"
                        />
                        {fetchingVehicleData && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchVehicleDetails(form.vehicleNumber)}
                        disabled={fetchingVehicleData || form.vehicleNumber.length < 5}
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-colors disabled:opacity-50"
                      >
                        Fetch RC
                      </button>
                    </div>
                  </div>
                  <div><label className={labelClass}>RC Owner Name</label><input className={inputClass} value={form.rcOwnerName} onChange={e => update('rcOwnerName', e.target.value)} /></div>
                  <div><label className={labelClass}>HPN / Financed Status</label><input className={inputClass} value={form.hpnAtLogin} onChange={e => update('hpnAtLogin', e.target.value)} placeholder="Auto-filled from RC" /></div>
                  <div><label className={labelClass}>Maker's Name</label><input className={inputClass} value={form.makerName} onChange={e => update('makerName', e.target.value)} /></div>
                  <div><label className={labelClass}>Model / Variant</label><input className={inputClass} value={form.modelVariantName} onChange={e => update('modelVariantName', e.target.value)} /></div>
                  <div><label className={labelClass}>Mfg Year <span className="text-[10px] text-accent opacity-70 ml-1 font-normal">(Auto)</span></label><input type="number" className={inputClass} value={form.mfgYear} onChange={e => update('mfgYear', e.target.value)} min="2000" max="2030" /></div>
                  <div><label className={labelClass}>Chassis Number</label><input className={inputClass} value={form.chassisNumber} onChange={e => update('chassisNumber', e.target.value)} /></div>
                  <div><label className={labelClass}>Engine Number</label><input type="text" autoComplete="off" className={inputClass} value={form.engineNumber} onChange={e => update('engineNumber', e.target.value)} /></div>
                </div>

                {/* Check Challans Button */}
                {(form.chassisNumber && form.engineNumber && form.vehicleNumber) && (
                  <div className="flex flex-col gap-3 pt-2 md:col-span-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={checkChallans}
                        disabled={fetchingChallans}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 shadow-sm"
                      >
                        {fetchingChallans ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking...</>
                        ) : (
                          <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg> Check Challans</>
                        )}
                      </button>
                      {challanData && (
                        <button
                          type="button"
                          onClick={() => setChallanData(null)}
                          className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                        >
                          Clear Results
                        </button>
                      )}
                    </div>

                    {challanData && (
                      <div className="border border-red-100 dark:border-red-900/30 rounded-xl bg-card overflow-hidden shadow-sm mt-1 animate-in fade-in slide-in-from-top-2">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                          <div>
                            <h3 className="text-sm font-bold text-foreground">Challan Details</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">RC: {form.vehicleNumber}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {(() => {
                              const challans = challanData.challans || [];
                              const pending = challans.filter((c: any) => c.challan_status === 'Pending');
                              const pendingTotal = pending.reduce((s: number, c: any) => s + (c.amount || 0), 0);
                              return challans.length > 0 ? (
                                <div className="text-right">
                                  <span className={`text-sm font-bold ${pending.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {pending.length > 0 ? `₹${pendingTotal.toLocaleString()} Pending` : 'All Cleared'}
                                  </span>
                                  <p className="text-xs text-muted-foreground">{challans.length} total challan(s)</p>
                                </div>
                              ) : null;
                            })()}
                            <button
                              type="button"
                              onClick={() => setChallanData(null)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                              title="Dismiss"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto w-full">
                          {(challanData.challans || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                              <p className="text-sm font-medium">No challans found</p>
                              <p className="text-xs mt-1">This vehicle has a clean record across checked portals.</p>
                            </div>
                          ) : (
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="text-left p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">#</th>
                                  <th className="text-left p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">Challan No.</th>
                                  <th className="text-left p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">Date</th>
                                  <th className="text-left p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">State</th>
                                  <th className="text-left p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">Offense</th>
                                  <th className="text-left p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">Accused</th>
                                  <th className="text-right p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">Amount</th>
                                  <th className="text-center p-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(challanData.challans || []).map((c: any, idx: number) => (
                                  <tr key={idx} className={`border-b border-border/50 transition-colors ${
                                    c.challan_status === 'Pending' ? 'bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/70' : 'hover:bg-muted/30'
                                  }`}>
                                    <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                    <td className="p-3 font-mono text-xs text-foreground">{c.challan_number}</td>
                                    <td className="p-3 text-foreground whitespace-nowrap text-xs">{c.challan_date || '—'}</td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">{c.state}</span>
                                    </td>
                                    <td className="p-3 text-foreground text-xs max-w-[180px] truncate" title={c.offense_details}>{c.offense_details}</td>
                                    <td className="p-3 text-foreground text-xs">{c.accused_name || '—'}</td>
                                    <td className="p-3 text-right font-bold text-foreground">₹{(c.amount || 0).toLocaleString()}</td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        c.challan_status === 'Pending'
                                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                          : c.challan_status
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                          : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {c.challan_status || 'Unknown'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              {(challanData.challans || []).some((c: any) => c.challan_status === 'Pending') && (
                                <tfoot>
                                  <tr className="bg-red-50/60 dark:bg-red-950/20">
                                    <td colSpan={6} className="p-3 font-bold text-red-600 text-sm">Total Pending Amount</td>
                                    <td className="p-3 text-right font-bold text-red-600 text-sm">
                                      ₹{(challanData.challans || []).filter((c: any) => c.challan_status === 'Pending').reduce((s: number, c: any) => s + (c.amount || 0), 0).toLocaleString()}
                                    </td>
                                    <td />
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Categorization Dropdowns (Moved after RC fields) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div>
                    <label className={labelClass}>Vertical</label>
                    <select className={inputClass} value={form.vertical} onChange={e => update('vertical', e.target.value)}>
                      <option value="">Select Vertical</option>
                      {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Scheme</label>
                    <select className={inputClass} value={form.scheme} onChange={e => update('scheme', e.target.value)}>
                      <option value="">Select Scheme</option>
                      {SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Loan Type</label>
                    <select className={inputClass} value={form.loanTypeVehicle} onChange={e => update('loanTypeVehicle', e.target.value)}>
                      <option value="">Select Type</option>
                      {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Insurance details */}
                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div><label className={labelClass}>Insurance Company</label><input className={inputClass} value={form.insuranceCompanyName} onChange={e => update('insuranceCompanyName', e.target.value)} /></div>
                    <div><label className={labelClass}>Policy Number</label><input className={inputClass} value={form.insurancePolicyNumber} onChange={e => update('insurancePolicyNumber', e.target.value)} /></div>
                    <div><label className={labelClass}>Premium Amount (₹)</label><input type="number" className={inputClass} value={form.premiumAmount} onChange={e => update('premiumAmount', e.target.value)} /></div>
                    <div><label className={labelClass}>Insurance Start Date</label><input type="date" className={inputClass} value={form.insuranceStartDate} onChange={e => update('insuranceStartDate', e.target.value)} /></div>
                    <div><label className={labelClass}>Insurance Expiry Date</label><input type="date" className={inputClass} value={form.insuranceDate} onChange={e => update('insuranceDate', e.target.value)} /></div>
                    <div>
                      <label className={labelClass}>Insurance Status</label>
                      <select className={inputClass} value={form.insuranceStatus} onChange={e => update('insuranceStatus', e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Renewed">Renewed</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Insurance Made By</label>
                      <select className={inputClass} value={form.insuranceMadeBy} onChange={e => update('insuranceMadeBy', e.target.value)}>
                        <option value="">Select</option>
                        {INSURANCE_MADE_BY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-1 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.insuranceReminderEnabled} onChange={e => update('insuranceReminderEnabled', e.target.checked)} className="w-4 h-4 rounded border-border" />
                        <span className="text-xs font-medium text-foreground">Send Expiry Reminder</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* RTO Details */}
                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>RTO Agent Name</label><input className={inputClass} value={form.rtoAgentName} onChange={e => update('rtoAgentName', e.target.value)} /></div>
                    <div><label className={labelClass}>Agent Mobile</label><input className={inputClass} value={form.agentMobileNo} onChange={e => update('agentMobileNo', e.target.value)} maxLength={10} /></div>
                    <div><label className={labelClass}>New Financier</label><input className={inputClass} value={form.newFinancier} onChange={e => update('newFinancier', e.target.value)} /></div>
                    <div><label className={labelClass}>DTO Location</label><input className={inputClass} value={form.dtoLocation} onChange={e => update('dtoLocation', e.target.value)} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>RTO Work Description</label><input className={inputClass} value={form.rtoWorkDescription} onChange={e => update('rtoWorkDescription', e.target.value)} /></div>

                    {/* Dropdowns/Special fields moved here */}
                    <div><label className={labelClass}>Is Financed (at Login)?</label><select className={inputClass} value={form.isFinanced} onChange={e => update('isFinanced', e.target.value)}><option value="">Select</option>{YES_NO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div><label className={labelClass}>RTO Docs Handover Date</label><input type="date" className={inputClass} value={form.rtoDocsHandoverDate} onChange={e => update('rtoDocsHandoverDate', e.target.value)} /></div>



                  </div>
                </div>
              </div>

              {/* ─── SECTION 3: Loan, EMI & Financier Details ─── */}
              <div className="bg-card rounded-lg border border-border p-5 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">3</span>
                  Loan, EMI & Finance Details
                </h2>

                {/* Loan Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelClass}>Proposed Loan Amount</label><input className={inputClass} value={form.purposeLoanAmount} onChange={e => update('purposeLoanAmount', e.target.value)} /></div>
                  <div><label className={labelClass}>Actual Loan Amount (₹) *</label><input required type="number" className={inputClass} value={form.loanAmount} onChange={e => update('loanAmount', e.target.value)} /></div>
                  <div><label className={labelClass}>LTV (%)</label><input type="number" className={inputClass} value={form.ltv} onChange={e => update('ltv', e.target.value)} /></div>
                  <div><label className={labelClass}>FC Amount (Foreclosure) (₹)</label><input type="number" className={inputClass} value={form.fcAmount} onChange={e => update('fcAmount', e.target.value)} /></div>
                  <div><label className={labelClass}>FC Date (Foreclosure Date)</label><input type="date" className={inputClass} value={form.fcDate} onChange={e => update('fcDate', e.target.value)} /></div>
                </div>

                {/* EMI Details */}
                <div className="pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><label className={labelClass}>IRR (%) *</label><input required type="number" step="0.01" className={inputClass} value={form.irr} onChange={e => update('irr', e.target.value)} /></div>
                  <div><label className={labelClass}>Manual EMI (₹)</label><input type="number" className={inputClass} value={form.emiAmount} onChange={e => update('emiAmount', e.target.value)} placeholder="Auto-calculated" /></div>
                  <div>
                    <label className={labelClass}>Tenure (Months) *</label>
                    {!showCustomTenure ? (
                      <select required className={inputClass} value={tenureOptions.includes(Number(form.tenure)) ? form.tenure : 'custom'} onChange={e => handleTenureChange(e.target.value)}>
                        {tenureOptions.map(t => <option key={t} value={t}>{t} MONTHS</option>)}
                        <option value="custom">Other (Manual)</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input required type="number" min="1" max="120" className={inputClass} value={customTenure} onChange={e => handleCustomTenureChange(e.target.value)} />
                        <button type="button" onClick={() => { setShowCustomTenure(false); setCustomTenure(''); update('tenure', '60'); }} className="px-2 py-2 rounded-lg border border-border hover:bg-muted">↩</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>EMI Mode</label>
                    <select className={inputClass} value={form.emiMode} onChange={e => update('emiMode', e.target.value)}>
                      <option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option>
                      <option value="Half Yearly">Half Yearly</option><option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div><label className={labelClass}>Total Deduction from Financer (₹)</label><input type="number" className={inputClass} value={form.processingFee} onChange={e => update('processingFee', e.target.value)} /></div>
                  <div><label className={labelClass}>EMI Start Date</label><input type="date" className={inputClass} value={form.emiStartDate} onChange={e => update('emiStartDate', e.target.value)} /></div>
                  <div><label className={labelClass}>EMI End Date</label><input type="date" className={inputClass} value={form.emiEndDate} onChange={e => update('emiEndDate', e.target.value)} /></div>
                </div>

                {emi > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/10">
                    <div className="flex items-center gap-2 mb-3"><Calculator size={14} className="text-accent" /><span className="text-accent font-semibold text-xs uppercase tracking-wider">EMI Calculator Preview</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="text-center p-2 rounded-lg bg-background/50"><p className="text-[10px] text-muted-foreground mb-1">Calculated EMI</p><p className="text-lg font-bold text-accent">{formatCurrency(emi)}</p></div>
                      <div className="text-center p-2 rounded-lg bg-background/50"><p className="text-[10px] text-muted-foreground mb-1">Total Interest</p><p className="text-lg font-bold text-foreground">{formatCurrency(totalInterest > 0 ? totalInterest : 0)}</p></div>
                      <div className="text-center p-2 rounded-lg bg-background/50"><p className="text-[10px] text-muted-foreground mb-1">Total Payable</p><p className="text-lg font-bold text-foreground">{formatCurrency(totalPayable)}</p></div>
                      <button type="button" onClick={() => update('emiAmount', String(emi))} className="h-full px-4 rounded-lg bg-accent text-accent-foreground font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all active:scale-95"><Calculator size={16} /> Apply EMI</button>
                    </div>
                  </div>
                )}

                {/* Financier Details */}
                <div className="pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Financier</label>
                    <select className={inputClass} value={form.assignedBankId} onChange={e => update('assignedBankId', e.target.value)}>
                      <option value="">Select Financier</option>
                      {(banks as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div><label className={labelClass}>Executive Name</label><input className={inputClass} value={form.financierExecutiveName} onChange={e => update('financierExecutiveName', e.target.value)} /></div>
                  <div><label className={labelClass}>Disbursement Branch</label><input className={inputClass} value={form.disburseBranchName} onChange={e => update('disburseBranchName', e.target.value)} /></div>
                  <div>
                    <label className={labelClass}>Booking Mode</label>
                    <select className={inputClass} value={form.bookingMode} onChange={e => update('bookingMode', e.target.value)}>
                      <option value="self">Self</option>
                      <option value="broker">Broker</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Financier Team Vertical</label>
                    <select className={inputClass} value={form.financierTeamVertical} onChange={e => update('financierTeamVertical', e.target.value)}>
                      <option value="">Select Financier Team Vertical</option>
                      {FINANCIER_TEAM_VERTICAL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Vertical (Read only)</label>
                    <input disabled className={`${inputClass} bg-muted/30 cursor-not-allowed`} value={form.vertical} />
                  </div>
                  {form.bookingMode === 'broker' && (
                    <div>
                      <label className={labelClass}>Broker Name</label>
                      <select className={inputClass} value={form.assignedBrokerId} onChange={e => update('assignedBrokerId', e.target.value)}>
                        <option value="">Select Broker</option>
                        {(brokers as any[]).filter(b => b.dsa_code).sort((a, b) => {
                          const numA = parseInt(a.dsa_code.replace(/^\D+/g, '')) || 0;
                          const numB = parseInt(b.dsa_code.replace(/^\D+/g, '')) || 0;
                          return numA - numB;
                        }).map((b: any) => {
                          const number = b.dsa_code.replace(/^\D+/g, '');
                          const prefixMatch = b.dsa_code.match(/^MEH([A-Z]+)/);
                          const initials = prefixMatch ? prefixMatch[1] : '';
                          return (
                            <option key={b.id} value={b.id}>
                              {`MEH${initials}${number}`} | {b.name}
                            </option>
                          );
                        })}
                        {(brokers as any[]).filter(b => !b.dsa_code).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                  {form.assignedBankId && (
                    <>
                      <div><label className={labelClass}>Sanction Amount (₹)</label><input type="number" className={inputClass} value={form.sanctionAmount} onChange={e => update('sanctionAmount', e.target.value)} /></div>
                      <div><label className={labelClass}>Sanction Date</label><input type="date" className={inputClass} value={form.sanctionDate} onChange={e => update('sanctionDate', e.target.value)} /></div>
                    </>
                  )}
                </div>

                {/* Broker Payout Summary (Inline) */}
                {form.bookingMode === 'broker' && computedCommission.amount > 0 && form.assignedBrokerId && (
                  <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Broker Payout Summary</span>
                      {computedCommission.payoutType && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${computedCommission.payoutType === 'Zero Payout' ? 'bg-red-100 text-red-700' : computedCommission.payoutType === 'Half Payout' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{computedCommission.payoutType}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="text-center p-2 rounded-lg bg-background/50"><p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-tighter">Calculation Rate</p><p className="text-lg font-bold text-foreground">{computedCommission.rate}%</p></div>
                      <div className="text-center p-2 rounded-lg bg-background/50"><p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-tighter">Payout Amount</p><p className="text-lg font-bold text-green-600">{formatCurrency(computedCommission.amount)}</p></div>
                      <div className="text-center p-2 rounded-lg bg-background/50 flex flex-col justify-center"><p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-tighter">Vertical</p><p className="text-xs font-bold text-foreground">{computedCommission.calculationBreakdown?.vertical}</p></div>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── SECTION 4: Disbursement & Payout Details ─── */}
              <div className="bg-card rounded-lg border border-border p-5 shadow-sm space-y-6 text-foreground">
                <h2 className="text-lg font-bold flex items-center gap-2 pb-2 border-b border-border/50">
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">4</span>
                  Disbursement & Payout Details
                </h2>

                {/* Deduction */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                    <IndianRupee size={14} /> Deduction Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>Mehar Deduction (₹)</label><input type="number" className={inputClass} value={form.meharDeduction} onChange={e => update('meharDeduction', e.target.value)} /></div>
                  </div>
                </div>

                {/* Disbursement */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                    <Calculator size={14} /> Disbursement Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>Hold Amount (By Financier) (₹)</label><input type="number" className={inputClass} value={form.holdAmount} onChange={e => update('holdAmount', e.target.value)} /></div>
                    <div><label className={labelClass}>Received Amount (₹)</label><input type="number" className={inputClass} value={form.netSeedAmount} onChange={e => update('netSeedAmount', e.target.value)} /></div>
                    <div><label className={labelClass}>Payment In Favour</label><input className={inputClass} value={form.paymentInFavour} onChange={e => update('paymentInFavour', e.target.value)} /></div>
                    <div><label className={labelClass}>Net Disbursement Amount (₹)</label><input type="number" className={inputClass} value={form.netDisbursementAmount} onChange={e => update('netDisbursementAmount', e.target.value)} /></div>
                    <div><label className={labelClass}>Disbursement Date</label><input type="date" className={inputClass} value={form.disbursementDate} onChange={e => update('disbursementDate', e.target.value)} /></div>
                    <div><label className={labelClass}>Payment Received Date</label><input type="date" className={inputClass} value={form.paymentReceivedDate} onChange={e => update('paymentReceivedDate', e.target.value)} /></div>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 5: Other Details & Tracking ─── */}
              <div className="bg-card rounded-lg border border-border p-5 shadow-sm space-y-6 text-foreground">
                <h2 className="text-lg font-bold flex items-center gap-2 pb-2 border-b border-border/50">
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">5</span>
                  Other Details & Remarks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelClass}>Login Date</label><input type="date" className={inputClass} value={form.loginDate} onChange={e => update('loginDate', e.target.value)} /></div>
                  <div><label className={labelClass}>Approval Date</label><input type="date" className={inputClass} value={form.approvalDate} onChange={e => update('approvalDate', e.target.value)} /></div>
                  <div><label className={labelClass}>Sourcing Person</label><input className={inputClass} value={form.sourcingPersonName} onChange={e => update('sourcingPersonName', e.target.value)} /></div>
                  <div className="md:col-span-3"><label className={labelClass}>Remark</label><textarea className={inputClass} rows={3} value={form.remark} onChange={e => update('remark', e.target.value)} /></div>
                </div>
              </div>

              {/* ─── SECTION 6: Document Uploads ─── */}
              <div className="bg-card rounded-lg border border-border p-5 shadow-sm space-y-6 text-foreground">
                <h2 className="text-lg font-bold flex items-center gap-2 pb-2 border-b border-border/50">
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">6</span>
                  Document Uploads
                </h2>

                {/* Customer Documents */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    CUSTOMER DOCUMENTS
                  </h3>

                  {/* Document Selection Checkboxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/20 rounded-xl border border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showAadhar} onChange={e => update('showAadhar', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Aadhar Card</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showPan} onChange={e => update('showPan', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Pan Card</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showBankStatement} onChange={e => update('showBankStatement', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Bank Statement</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showCheque} onChange={e => update('showCheque', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Cheque</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showRC} onChange={e => update('showRC', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">RC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showIncomeProof} onChange={e => update('showIncomeProof', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Income Proof</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showCustomerPhoto} onChange={e => update('showCustomerPhoto', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Customer Photo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showInsurance} onChange={e => update('showInsurance', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Insurance</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showCustomerLedger} onChange={e => update('showCustomerLedger', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Customer Ledger</span>
                    </label>
                  </div>

                  {/* Document Upload Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {form.showAadhar && (
                      <>
                        <DocumentUploadCard
                          label="Aadhar Card Front"
                          type="aadhar_front"
                          file={form.aadharFront as File}
                          existingDoc={uploadedDocs.find(d => d.document_type === 'aadhar_front')}
                          onChange={val => update('aadharFront', val)}
                          onClear={() => handleClearDocument('aadharFront', uploadedDocs.find(d => d.document_type === 'aadhar_front'))}
                        />
                        <DocumentUploadCard
                          label="Aadhar Card Back"
                          type="aadhar_back"
                          file={form.aadharBack as File}
                          existingDoc={uploadedDocs.find(d => d.document_type === 'aadhar_back')}
                          onChange={val => update('aadharBack', val)}
                          onClear={() => handleClearDocument('aadharBack', uploadedDocs.find(d => d.document_type === 'aadhar_back'))}
                        />
                      </>
                    )}
                    {form.showPan && (
                      <DocumentUploadCard
                        label="Pan Card"
                        type="pan_card"
                        file={form.panCard as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'pan_card')}
                        onChange={val => update('panCard', val)}
                        onClear={() => handleClearDocument('panCard', uploadedDocs.find(d => d.document_type === 'pan_card'))}
                      />
                    )}
                    {form.showBankStatement && (
                      <DocumentUploadCard
                        label="Bank Statement"
                        type="bank_statement"
                        file={form.bankStatement as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'bank_statement')}
                        onChange={val => update('bankStatement', val)}
                        onClear={() => handleClearDocument('bankStatement', uploadedDocs.find(d => d.document_type === 'bank_statement'))}
                      />
                    )}
                    {form.showCheque && (
                      <DocumentUploadCard
                        label="Cheque"
                        type="cheque"
                        file={form.cheque as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'cheque')}
                        onChange={val => update('cheque', val)}
                        onClear={() => handleClearDocument('cheque', uploadedDocs.find(d => d.document_type === 'cheque'))}
                      />
                    )}
                    {form.showRC && (
                      <>
                        <DocumentUploadCard
                          label="RC (Front)"
                          type="rc_front"
                          file={form.rcFront as File}
                          existingDoc={uploadedDocs.find(d => d.document_type === 'rc_front')}
                          onChange={val => update('rcFront', val)}
                          onClear={() => handleClearDocument('rcFront', uploadedDocs.find(d => d.document_type === 'rc_front'))}
                        />
                        <DocumentUploadCard
                          label="RC (Back)"
                          type="rc_back"
                          file={form.rcBack as File}
                          existingDoc={uploadedDocs.find(d => d.document_type === 'rc_back')}
                          onChange={val => update('rcBack', val)}
                          onClear={() => handleClearDocument('rcBack', uploadedDocs.find(d => d.document_type === 'rc_back'))}
                        />
                      </>
                    )}
                    {form.showIncomeProof && (
                      <DocumentUploadCard
                        label="Income Proof"
                        type="income_proof"
                        file={form.incomeProof as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'income_proof')}
                        onChange={val => update('incomeProof', val)}
                        onClear={() => handleClearDocument('incomeProof', uploadedDocs.find(d => d.document_type === 'income_proof'))}
                      />
                    )}
                    {form.showCustomerPhoto && (
                      <DocumentUploadCard
                        label="Customer Photo"
                        type="customer_photo"
                        file={form.customerPhoto as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'customer_photo')}
                        onChange={val => update('customerPhoto', val)}
                        onClear={() => handleClearDocument('customerPhoto', uploadedDocs.find(d => d.document_type === 'customer_photo'))}
                      />
                    )}
                    {form.showInsurance && (
                      <DocumentUploadCard
                        label="Insurance"
                        type="insurance"
                        file={form.insurance as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'insurance')}
                        onChange={val => update('insurance', val)}
                        onClear={() => handleClearDocument('insurance', uploadedDocs.find(d => d.document_type === 'insurance'))}
                      />
                    )}
                    {form.showCustomerLedger && (
                      <DocumentUploadCard
                        label="Customer Ledger"
                        type="customer_ledger"
                        file={form.customerLedger as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'customer_ledger')}
                        onChange={val => update('customerLedger', val)}
                        onClear={() => handleClearDocument('customerLedger', uploadedDocs.find(d => d.document_type === 'customer_ledger'))}
                      />
                    )}
                  </div>
                </div>

                {/* Other KYC Documents */}
                {/* Other KYC / RTO Documents */}
                <div className="space-y-4 pt-6 border-t border-border/50">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    OTHER KYC / RTO DOCUMENTS
                  </h3>

                  {/* Document Selection Checkboxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/20 rounded-xl border border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showRtoDocument} onChange={e => update('showRtoDocument', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">RTO Document</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showNoc} onChange={e => update('showNoc', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">NOC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showThirdParty} onChange={e => update('showThirdParty', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">3rd Party</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showStamp} onChange={e => update('showStamp', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Stamp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showRcDocument} onChange={e => update('showRcDocument', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">RC Document</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showFitnessDoc} onChange={e => update('showFitnessDoc', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">FC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showTaxReceipt} onChange={e => update('showTaxReceipt', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">Tax Receipt</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={form.showDmDocument} onChange={e => update('showDmDocument', e.target.checked)} className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all" />
                      <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">DM</span>
                    </label>
                  </div>

                  {/* Document Upload Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {form.showRtoDocument && (
                      <DocumentUploadCard
                        label="RTO Document"
                        type="rto_document"
                        file={form.rtoDocument as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'rto_document')}
                        onChange={val => update('rtoDocument', val)}
                        onClear={() => handleClearDocument('rtoDocument', uploadedDocs.find(d => d.document_type === 'rto_document'))}
                      />
                    )}
                    {form.showNoc && (
                      <DocumentUploadCard
                        label="NOC"
                        type="noc"
                        file={form.noc as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'noc')}
                        onChange={val => update('noc', val)}
                        onClear={() => handleClearDocument('noc', uploadedDocs.find(d => d.document_type === 'noc'))}
                      />
                    )}
                    {form.showThirdParty && (
                      <DocumentUploadCard
                        label="3rd Party"
                        type="third_party"
                        file={form.thirdParty as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'third_party')}
                        onChange={val => update('thirdParty', val)}
                        onClear={() => handleClearDocument('thirdParty', uploadedDocs.find(d => d.document_type === 'third_party'))}
                      />
                    )}
                    {form.showStamp && (
                      <DocumentUploadCard
                        label="Stamp"
                        type="stamp"
                        file={form.stamp as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'stamp')}
                        onChange={val => update('stamp', val)}
                        onClear={() => handleClearDocument('stamp', uploadedDocs.find(d => d.document_type === 'stamp'))}
                      />
                    )}
                    {form.showRcDocument && (
                      <DocumentUploadCard
                        label="RC Document"
                        type="rc_document"
                        file={form.rcDocument as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'rc_document')}
                        onChange={val => update('rcDocument', val)}
                        onClear={() => handleClearDocument('rcDocument', uploadedDocs.find(d => d.document_type === 'rc_document'))}
                      />
                    )}
                    {form.showFitnessDoc && (
                      <DocumentUploadCard
                        label="FC"
                        type="fitness_document"
                        file={form.fitnessDocument as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'fitness_document')}
                        onChange={val => update('fitnessDocument', val)}
                        onClear={() => handleClearDocument('fitnessDocument', uploadedDocs.find(d => d.document_type === 'fitness_document'))}
                      />
                    )}
                    {form.showTaxReceipt && (
                      <DocumentUploadCard
                        label="Tax Receipt"
                        type="tax_receipt"
                        file={form.taxReceipt as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'tax_receipt')}
                        onChange={val => update('taxReceipt', val)}
                        onClear={() => handleClearDocument('taxReceipt', uploadedDocs.find(d => d.document_type === 'tax_receipt'))}
                      />
                    )}
                    {form.showDmDocument && (
                      <DocumentUploadCard
                        label="DM"
                        type="dm_document"
                        file={form.dmDocument as File}
                        existingDoc={uploadedDocs.find(d => d.document_type === 'dm_document')}
                        onChange={val => update('dmDocument', val)}
                        onClear={() => handleClearDocument('dmDocument', uploadedDocs.find(d => d.document_type === 'dm_document'))}
                      />
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-96 space-y-6 shrink-0">
            <div className="lg:sticky lg:top-4 h-fit space-y-6">
              {/* Manager Remarks Section */}
              {form.remark && (form.fileStatus === 'sent_back' || form.fileStatus === 'rejected') && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="text-amber-600 dark:text-amber-500" size={18} />
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Branch Manager Remarks</h3>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                    <p className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed font-medium italic">
                      "{form.remark}"
                    </p>
                  </div>
                </div>
              )}

              {/* Application Summary Card */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-accent" />
                  Application Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${form.fileStatus === 'approved' ? 'bg-green-500/10 text-green-500' :
                      form.fileStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        form.fileStatus === 'sent_back' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                      }`}>
                      {form.fileStatus || 'Submitted'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Applicant</span>
                    <span className="font-semibold text-foreground">{form.customerName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Loan Amount</span>
                    <span className="font-bold text-accent">{formatCurrency(Number(form.loanAmount || 0))}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    form="loan-form"
                    onClick={() => document.querySelector('form')?.requestSubmit()}
                    disabled={createLoan.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-accent-foreground font-bold text-sm shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {createLoan.isPending ? (
                      <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    {isEditMode ? 'Update Application' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full py-2.5 px-4 rounded-xl border border-border bg-card text-foreground font-bold text-xs hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Workflow History Section */}
              {isEditMode && auditLogs.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/30">
                    <Clock size={16} className="text-accent" />
                    <h3 className="text-sm font-bold text-foreground">Workflow History</h3>
                  </div>
                  <div className="p-5 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {auditLogs.map((log: any, index: number) => (
                      <div key={log.id} className="relative pl-6">
                        {/* Timeline connector */}
                        {index < auditLogs.length - 1 && (
                          <div className="absolute left-[7px] top-[18px] bottom-[-24px] w-[2px] bg-border" />
                        )}
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-[6px] w-3.5 h-3.5 rounded-full border-2 border-accent bg-background z-10" />

                        <div className="flex flex-col gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground">
                              {LOAN_STATUSES.find(s => s.value === log.to_status)?.label || log.to_status}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(log.performed_at).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] text-muted-foreground">
                            By <span className="text-foreground font-semibold">{log.performed_by_name || 'System'}</span>
                          </p>
                          {log.remarks && (
                            <div className="mt-1 p-2 rounded-lg bg-muted/40 border border-border/50">
                              <p className="text-[10px] text-foreground italic whitespace-pre-wrap">
                                "{log.remarks}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {showDeleteDocModal && docToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <FileText size={24} className="text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Delete Saved Document?
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Are you sure you want to delete this document from the server?
                </p>
                <p className="text-sm font-medium text-red-500">
                  This action cannot be undone.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Document Details:</p>
                  <p className="text-sm font-medium text-foreground">{docToDelete.document_name || docToDelete.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{docToDelete.document_type?.replace(/_/g, ' ').toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteDocModal(false);
                  setDocToDelete(null);
                }}
                disabled={deleteDocument.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDocument.mutate(docToDelete.id)}
                disabled={deleteDocument.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteDocument.isPending ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

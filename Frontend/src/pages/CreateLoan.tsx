import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, externalAPI, loansAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CAR_MAKES, VERTICALS, SCHEMES, LOAN_TYPES, INSURANCE_MADE_BY_OPTIONS, YES_NO_OPTIONS, FINANCIER_TEAM_VERTICAL_OPTIONS } from '@/lib/constants';
import { calculateEMI, formatCurrency, normalizeLoanNumberVertical } from '@/lib/utils';
import { getRolePermissions } from '@/lib/permissions';
import { ArrowLeft, Calculator, Search, X, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCommission, calculateAdvancedCommission } from '@/lib/schemes';

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

  const [form, setForm] = useState({
    // Customer Details
    customerId: '', customerName: '', mobile: '', panNumber: '', aadharNumber: '', ourBranch: '',
    currentAddress: '', currentVillage: '', currentTehsil: '', currentDistrict: '', currentState: '', currentPincode: '',
    sameAsCurrentAddress: false,
    permanentAddress: '', permanentVillage: '', permanentTehsil: '', permanentDistrict: '', permanentState: '', permanentPincode: '',
    // Loan & Vehicle Details
    loanNumber: '', purposeLoanAmount: '', loanAmount: '', ltv: '', loanTypeVehicle: '',
    vehicleNumber: '', makerName: '', modelVariantName: '', mfgYear: '', 
    chassisNumber: '', engineNumber: '',
    vertical: '', scheme: '',
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
    insuranceCompanyName: '', premiumAmount: '', insuranceDate: '', insurancePolicyNumber: '', insuranceMadeBy: '', insuranceReminderEnabled: false,
    // Deductions & Disbursement Details
    processingFee: '', netDisbursementAmount: '', paymentReceivedDate: '', meharDeduction: '', holdAmount: '', netSeedAmount: '', paymentInFavour: '',
    // Others
    loginDate: '', approvalDate: '', disbursementDate: '', sourcingPersonName: '', remark: '', fileStatus: 'submitted',
    // Documents
    aadharFront: null, aadharBack: null, panCard: null,
    bankStatement: null, cheque: null, rcFront: null, rcBack: null, incomeProof: null,
    customerPhoto: null, insurance: null, customerLedger: null,
    // Other KYC Documents
    rtoDocument: null, noc: null, thirdParty: null, stamp: null, rcDocument: null, fitnessDocument: null, taxReceipt: null,
    // Document checkboxes
    showAadhar: false, showPan: false, showBankStatement: false, showCheque: false,
    showRC: false, showIncomeProof: false, showCustomerPhoto: false, showInsurance: false, showCustomerLedger: false,
    // Other KYC checkboxes
    showRtoDocument: false, showNoc: false, showThirdParty: false, showStamp: false, showRcDocument: false, showFitnessDoc: false, showTaxReceipt: false,
  });

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
      console.log('Fetching from backend proxy');
      toast.info('Fetching vehicle details...');
      
      const rcData = await externalAPI.fetchRCData(rcNumber);
      console.log('RC Proxy Response:', rcData);

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

        toast.success('Vehicle details fetched successfully!');
      } else {
        toast.error('Could not fetch vehicle details');
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
        insurancePolicyNumber: existingLoan.insurance_policy_number || '',
        insuranceMadeBy: existingLoan.insurance_made_by || '',
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
        rtoDocument: null, noc: null, thirdParty: null, stamp: null, rcDocument: null, fitnessDocument: null, taxReceipt: null,
        showAadhar: false, showPan: false, showBankStatement: false, showCheque: false,
        showRC: false, showIncomeProof: false, showCustomerPhoto: false, showInsurance: false, showCustomerLedger: false,
        showRtoDocument: false, showNoc: false, showThirdParty: false, showStamp: false, showRcDocument: false, showFitnessDoc: false, showTaxReceipt: false,
      });
      
      // Handle custom tenure for edit mode
      const existingTenure = String(existingLoan.tenure || '60');
      if (!tenureOptions.includes(Number(existingTenure))) {
        setShowCustomTenure(true);
        setCustomTenure(existingTenure);
      }
    }
  }, [isEditMode, existingLoan]);

  const update = (key: string, val: string | File | null | boolean) => {
    setForm(f => {
      const newForm = { ...f, [key]: val };
      if (key === 'bookingMode' && val === 'self') {
        newForm.assignedBrokerId = '';
      }
      // Save to localStorage
      localStorage.setItem('loan_form_draft', JSON.stringify(newForm));
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
    setLeadSearch(leadToConvert.customer_id || '');
    prefilledLeadRef.current = leadId;
  }, [leadId, leadToConvert, isEditMode]);

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
      { file: form.taxReceipt, type: 'tax_receipt', name: 'DM' },
    ].filter(doc => doc.file !== null);

    if (documents.length === 0) {
      console.log('No documents to upload');
      return;
    }

    console.log(`Uploading ${documents.length} documents for loan ${loanId}`);
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
        console.log('Upload result:', result);
        setUploadedDocs(result.uploaded || []);
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
          pan_number: form.panNumber || null,
          aadhar_number: form.aadharNumber || null,
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
          purpose_loan_amount: form.purposeLoanAmount || null,
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
          fc_amount: form.fcAmount || null,
          fc_date: form.fcDate || null,
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
        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-lg border border-border p-5 shadow-sm mb-6 space-y-8">
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
                <div><label className={labelClass}>Our Branch</label><input className={inputClass} value={form.ourBranch} onChange={e => update('ourBranch', e.target.value)} /></div>

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
                <input
                  className={inputClass}
                  value={form.vehicleNumber}
                  onChange={e => {
                    const value = e.target.value.toUpperCase();
                    update('vehicleNumber', value);
                    if (value.length >= 8) fetchVehicleDetails(value);
                  }}
                  placeholder="e.g., RJ60SW9525"
                />
                {fetchingVehicleData && (
                  <div className="absolute right-3 top-8">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div><label className={labelClass}>RC Owner Name</label><input className={inputClass} value={form.rcOwnerName} onChange={e => update('rcOwnerName', e.target.value)} /></div>
              <div><label className={labelClass}>HPN / Financed Status</label><input className={inputClass} value={form.hpnAtLogin} onChange={e => update('hpnAtLogin', e.target.value)} placeholder="Auto-filled from RC" /></div>
              <div><label className={labelClass}>Maker's Name</label><input className={inputClass} value={form.makerName} onChange={e => update('makerName', e.target.value)} /></div>
              <div><label className={labelClass}>Model / Variant</label><input className={inputClass} value={form.modelVariantName} onChange={e => update('modelVariantName', e.target.value)} /></div>
              <div><label className={labelClass}>Mfg Year</label><input type="number" className={inputClass} value={form.mfgYear} onChange={e => update('mfgYear', e.target.value)} min="2000" max="2030" /></div>
              <div><label className={labelClass}>Chassis Number</label><input className={inputClass} value={form.chassisNumber} onChange={e => update('chassisNumber', e.target.value)} /></div>
              <div><label className={labelClass}>Engine Number</label><input type="text" autoComplete="off" className={inputClass} value={form.engineNumber} onChange={e => update('engineNumber', e.target.value)} /></div>
            </div>

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
                <div><label className={labelClass}>Insurance Expiry Date</label><input type="date" className={inputClass} value={form.insuranceDate} onChange={e => update('insuranceDate', e.target.value)} /></div>
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
              <div><label className={labelClass}>Purpose Loan Amount</label><input className={inputClass} value={form.purposeLoanAmount} onChange={e => update('purposeLoanAmount', e.target.value)} /></div>
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
              <div><label className={labelClass}>Processing Fee (₹)</label><input type="number" className={inputClass} value={form.processingFee} onChange={e => update('processingFee', e.target.value)} /></div>
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

            {/* Deduction */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Deduction Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Mehar Deduction (₹)</label><input type="number" className={inputClass} value={form.meharDeduction} onChange={e => update('meharDeduction', e.target.value)} /></div>
              </div>
            </div>

            {/* Disbursement */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Disbursement Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Hold Amount (By Financier) (₹)</label><input type="number" className={inputClass} value={form.holdAmount} onChange={e => update('holdAmount', e.target.value)} /></div>
                <div><label className={labelClass}>Received Amount (₹)</label><input type="number" className={inputClass} value={form.netSeedAmount} onChange={e => update('netSeedAmount', e.target.value)} /></div>
                <div><label className={labelClass}>Payment In Favour</label><input className={inputClass} value={form.paymentInFavour} onChange={e => update('paymentInFavour', e.target.value)} /></div>
                <div><label className={labelClass}>Net Disbursement Amount (₹)</label><input type="number" className={inputClass} value={form.netDisbursementAmount} onChange={e => update('netDisbursementAmount', e.target.value)} /></div>
                <div><label className={labelClass}>Disbursement Date</label><input type="date" className={inputClass} value={form.disbursementDate} onChange={e => update('disbursementDate', e.target.value)} /></div>
                <div><label className={labelClass}>Payment Received Date</label><input type="date" className={inputClass} value={form.paymentReceivedDate} onChange={e => update('paymentReceivedDate', e.target.value)} /></div>
                <div className="md:col-span-3 mt-4"><h3 className="font-semibold text-foreground mb-3">Other Details</h3></div>
                <div><label className={labelClass}>Login Date</label><input type="date" className={inputClass} value={form.loginDate} onChange={e => update('loginDate', e.target.value)} /></div>
                <div><label className={labelClass}>Approval Date</label><input type="date" className={inputClass} value={form.approvalDate} onChange={e => update('approvalDate', e.target.value)} /></div>
                <div><label className={labelClass}>Sourcing Person</label><input className={inputClass} value={form.sourcingPersonName} onChange={e => update('sourcingPersonName', e.target.value)} /></div>
                <div className="md:col-span-3"><label className={labelClass}>Remark</label><textarea className={inputClass} rows={3} value={form.remark} onChange={e => update('remark', e.target.value)} /></div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Documents</h2>

              {/* Document Preview Box */}
              {(Object.values(form).filter(v => v instanceof File).length > 0 || uploadedDocs.length > 0) && (
                <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Selected Documents</h3>
                    <span className="text-xs text-muted-foreground bg-accent/10 px-2 py-1 rounded-full">
                      {Object.values(form).filter(v => v instanceof File).length} files
                    </span>
                  </div>

                  {uploadingDocs && (
                    <div className="mb-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-blue-600 font-medium">Uploading documents...</span>
                      </div>
                    </div>
                  )}

                  {uploadedDocs.length > 0 && (
                    <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-600 font-medium">{uploadedDocs.length} documents uploaded successfully</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { file: form.aadharFront, name: 'Aadhar Front', type: 'aadhar_front' },
                      { file: form.aadharBack, name: 'Aadhar Back', type: 'aadhar_back' },
                      { file: form.panCard, name: 'PAN Card', type: 'pan_card' },
                      { file: form.bankStatement, name: 'Bank Statement', type: 'bank_statement' },
                      { file: form.cheque, name: 'Cheque', type: 'cheque' },
                      { file: form.rcFront, name: 'RC Front', type: 'rc_front' },
                      { file: form.rcBack, name: 'RC Back', type: 'rc_back' },
                      { file: form.incomeProof, name: 'Income Proof', type: 'income_proof' },
                      { file: form.customerPhoto, name: 'Customer Photo', type: 'customer_photo' },
                      { file: form.insurance, name: 'Insurance', type: 'insurance' },
                      { file: form.customerLedger, name: 'Customer Ledger', type: 'customer_ledger' },
                      { file: form.rtoDocument, name: 'RTO Document', type: 'rto_document' },
                      { file: form.noc, name: 'NOC', type: 'noc' },
                      { file: form.thirdParty, name: 'Third Party', type: 'third_party' },
                      { file: form.stamp, name: 'Stamp', type: 'stamp' },
                      { file: form.rcDocument, name: 'RC Document', type: 'rc_document' },
                      { file: form.fitnessDocument, name: 'FC', type: 'fitness_document' },
                      { file: form.taxReceipt, name: 'DM', type: 'tax_receipt' },
                    ].filter(doc => doc.file).map((doc) => {
                      const uploaded = uploadedDocs.find(u => u.document_type === doc.type);
                      return (
                        <div key={doc.type} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border">
                          <div className="flex-shrink-0">
                            {uploaded ? (
                              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{(doc.file as File).name}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const url = URL.createObjectURL(doc.file as File);
                                window.open(url, '_blank');
                              }}
                              className="p-1 hover:bg-muted rounded text-accent"
                              title="Preview"
                            >
                              <Eye size={14} />
                            </button>
                            {uploaded && (
                              <span className="text-[10px] text-green-600 font-medium whitespace-nowrap">Uploaded</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Documents */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Customer Documents</h3>

                {/* Document Selection Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showAadhar} onChange={e => update('showAadhar', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Aadhar Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showPan} onChange={e => update('showPan', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Pan Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showBankStatement} onChange={e => update('showBankStatement', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Bank Statement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showCheque} onChange={e => update('showCheque', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Cheque</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showRC} onChange={e => update('showRC', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">RC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showIncomeProof} onChange={e => update('showIncomeProof', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Income Proof</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showCustomerPhoto} onChange={e => update('showCustomerPhoto', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Customer Photo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showInsurance} onChange={e => update('showInsurance', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Insurance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showCustomerLedger} onChange={e => update('showCustomerLedger', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Customer Ledger</span>
                  </label>
                </div>

                {/* Document Upload Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.showAadhar && (
                    <>
                      <div>
                        <label className={labelClass}>Aadhar Card Front</label>
                        <input type="file" className={inputClass} onChange={e => update('aadharFront', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                        {form.aadharFront && <p className="text-xs text-green-600 mt-1">✓ {(form.aadharFront as File).name}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Aadhar Card Back</label>
                        <input type="file" className={inputClass} onChange={e => update('aadharBack', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                        {form.aadharBack && <p className="text-xs text-green-600 mt-1">✓ {(form.aadharBack as File).name}</p>}
                      </div>
                    </>
                  )}
                  {form.showPan && (
                    <div>
                      <label className={labelClass}>Pan Card</label>
                      <input type="file" className={inputClass} onChange={e => update('panCard', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.panCard && <p className="text-xs text-green-600 mt-1">✓ {(form.panCard as File).name}</p>}
                    </div>
                  )}
                  {form.showBankStatement && (
                    <div>
                      <label className={labelClass}>Last 6 Month Bank Statement</label>
                      <input type="file" className={inputClass} onChange={e => update('bankStatement', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.bankStatement && <p className="text-xs text-green-600 mt-1">✓ {(form.bankStatement as File).name}</p>}
                    </div>
                  )}
                  {form.showCheque && (
                    <div>
                      <label className={labelClass}>Cheque</label>
                      <input type="file" className={inputClass} onChange={e => update('cheque', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.cheque && <p className="text-xs text-green-600 mt-1">✓ {(form.cheque as File).name}</p>}
                    </div>
                  )}
                  {form.showRC && (
                    <>
                      <div>
                        <label className={labelClass}>RC (Front)</label>
                        <input type="file" className={inputClass} onChange={e => update('rcFront', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                        {form.rcFront && <p className="text-xs text-green-600 mt-1">✓ {(form.rcFront as File).name}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>RC (Back)</label>
                        <input type="file" className={inputClass} onChange={e => update('rcBack', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                        {form.rcBack && <p className="text-xs text-green-600 mt-1">✓ {(form.rcBack as File).name}</p>}
                      </div>
                    </>
                  )}
                  {form.showIncomeProof && (
                    <div>
                      <label className={labelClass}>Income Proof</label>
                      <input type="file" className={inputClass} onChange={e => update('incomeProof', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.incomeProof && <p className="text-xs text-green-600 mt-1">✓ {(form.incomeProof as File).name}</p>}
                    </div>
                  )}
                  {form.showCustomerPhoto && (
                    <div>
                      <label className={labelClass}>Customer Photo</label>
                      <input type="file" className={inputClass} onChange={e => update('customerPhoto', e.target.files?.[0] || null)} accept="image/*" />
                      {form.customerPhoto && <p className="text-xs text-green-600 mt-1">✓ {(form.customerPhoto as File).name}</p>}
                    </div>
                  )}
                  {form.showInsurance && (
                    <div>
                      <label className={labelClass}>Insurance</label>
                      <input type="file" className={inputClass} onChange={e => update('insurance', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.insurance && <p className="text-xs text-green-600 mt-1">✓ {(form.insurance as File).name}</p>}
                    </div>
                  )}
                  {form.showCustomerLedger && (
                    <div>
                      <label className={labelClass}>Customer Ledger</label>
                      <input type="file" className={inputClass} onChange={e => update('customerLedger', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.customerLedger && <p className="text-xs text-green-600 mt-1">✓ {(form.customerLedger as File).name}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Other KYC Documents */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Other KYC / RTO Documents</h3>

                {/* Document Selection Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showRtoDocument} onChange={e => update('showRtoDocument', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">RTO Document</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showNoc} onChange={e => update('showNoc', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">NOC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showThirdParty} onChange={e => update('showThirdParty', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">3rd Party</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showStamp} onChange={e => update('showStamp', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">Stamp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showRcDocument} onChange={e => update('showRcDocument', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">RC Document</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showFitnessDoc} onChange={e => update('showFitnessDoc', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">FC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showTaxReceipt} onChange={e => update('showTaxReceipt', e.target.checked)} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium">DM</span>
                  </label>
                </div>

                {/* Document Upload Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.showRtoDocument && (
                    <div>
                      <label className={labelClass}>RTO Document</label>
                      <input type="file" className={inputClass} onChange={e => update('rtoDocument', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.rtoDocument && <p className="text-xs text-green-600 mt-1">✓ {(form.rtoDocument as File).name}</p>}
                    </div>
                  )}
                  {form.showNoc && (
                    <div>
                      <label className={labelClass}>NOC</label>
                      <input type="file" className={inputClass} onChange={e => update('noc', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.noc && <p className="text-xs text-green-600 mt-1">✓ {(form.noc as File).name}</p>}
                    </div>
                  )}
                  {form.showThirdParty && (
                    <div>
                      <label className={labelClass}>3rd Party</label>
                      <input type="file" className={inputClass} onChange={e => update('thirdParty', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.thirdParty && <p className="text-xs text-green-600 mt-1">✓ {(form.thirdParty as File).name}</p>}
                    </div>
                  )}
                  {form.showStamp && (
                    <div>
                      <label className={labelClass}>Stamp</label>
                      <input type="file" className={inputClass} onChange={e => update('stamp', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.stamp && <p className="text-xs text-green-600 mt-1">✓ {(form.stamp as File).name}</p>}
                    </div>
                  )}
                  {form.showRcDocument && (
                    <div>
                      <label className={labelClass}>RC Document</label>
                      <input type="file" className={inputClass} onChange={e => update('rcDocument', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.rcDocument && <p className="text-xs text-green-600 mt-1">✓ {(form.rcDocument as File).name}</p>}
                    </div>
                  )}
                  {form.showFitnessDoc && (
                    <div>
                      <label className={labelClass}>FC</label>
                      <input type="file" className={inputClass} onChange={e => update('fitnessDocument', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.fitnessDocument && <p className="text-xs text-green-600 mt-1">✓ {(form.fitnessDocument as File).name}</p>}
                    </div>
                  )}
                  {form.showTaxReceipt && (
                    <div>
                      <label className={labelClass}>DM</label>
                      <input type="file" className={inputClass} onChange={e => update('taxReceipt', e.target.files?.[0] || null)} accept="image/*,.pdf" />
                      {form.taxReceipt && <p className="text-xs text-green-600 mt-1">✓ {(form.taxReceipt as File).name}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg border border-border font-medium hover:bg-muted transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoan.isPending}
                className="px-6 py-2 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-60 text-sm"
              >
                {createLoan.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (isEditMode ? 'Update Application' : 'Create Application')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

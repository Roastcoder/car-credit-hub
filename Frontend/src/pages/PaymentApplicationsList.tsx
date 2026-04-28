import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  X, 
  FileText, 
  CreditCard, 
  Download, 
  User, 
  ArrowRight, 
  List, 
  Receipt,
  Layers,
  CircleDashed,
  PieChart,
  CheckCircle2,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { paymentApplicationAPI, loansAPI } from '@/lib/api';
import { Button } from "@/components/ui/button";
import MobilePageSwitcher from '@/components/MobilePageSwitcher';
import { Badge } from "@/components/ui/badge";

interface PaymentApplication {
  id: number;
  loan_id: string;
  loan_number: string;
  applicant_name: string;
  applicant_phone: string;
  loan_amount?: number;
  payment_amount: number;
  payment_purpose: string;
  status: 'draft' | 'submitted' | 'manager_approved' | 'manager_rejected' | 'sent_back' | 'account_processing' | 'voucher_created' | 'payment_released' | 'completed';
  created_at: string;
  created_by: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  processed_by?: number;
  utr_number?: string;
  payment_proof_path?: string;
  bank_name?: string;
  vehicle_name?: string;
  vehicle_model?: string;
  vehicle_number?: string;
  financier_name?: string;
  disbursement_branch?: string;
  disbursement_amount?: number;
  old_release_amount?: number;
  total_release_amount?: number;
  mehar_deduction?: number;
  emi_amount?: number;
  voucher_number?: string;
}

export default function PaymentApplicationsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<PaymentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [releasePercentageFilter, setReleasePercentageFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingForId, setUploadingForId] = useState<number | null>(null);
  const [eligibleLoans, setEligibleLoans] = useState<any[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);

  const appSwitcherOptions = [
    { label: 'Application List', path: '/payments', icon: <List size={18} /> },
    { label: 'New Application', path: '/payments/new', icon: <Plus size={18} /> },
  ];

  useEffect(() => {
    fetchApplications();
    if (['employee', 'manager', 'super_admin'].includes(user?.role || '')) {
      fetchEligibleLoans();
    }
  }, [user?.role]);

  const fetchEligibleLoans = async () => {
    try {
      setEligibleLoading(true);
      const res = await loansAPI.getAll({ forPayment: 'true' });
      setEligibleLoans(res.data || []);
    } catch (error) {
      console.error('Error fetching eligible loans:', error);
    } finally {
      setEligibleLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await paymentApplicationAPI.getAll();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch payment applications');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerAction = async (applicationId: number, action: 'approve' | 'reject', remarks?: string) => {
    try {
      setActionLoading(true);
      await paymentApplicationAPI.managerAction(applicationId, action, remarks);
      toast.success(`Application ${action}d successfully`);
      fetchApplications();
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error(`Failed to ${action} application`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadProof = async (applicationId: number, file: File) => {
    try {
      setActionLoading(true);
      await paymentApplicationAPI.uploadProof(applicationId, file);
      toast.success('Payment proof uploaded successfully');
      fetchApplications();
      setUploadingForId(null);
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Failed to upload payment proof');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'manager_approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'manager_rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'account_processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'voucher_created': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'payment_released': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = (app.applicant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.loan_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.id.toString().includes(searchTerm) ||
                         (app.utr_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.voucher_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.bank_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    // Release Percentage Calculation
    const total = Number(app.disbursement_amount) || 0;
    const released = Number(app.old_release_amount) || 0;
    const pct = total > 0 ? (released / total) * 100 : 0;
    
    let matchesRelease = true;
    if (releasePercentageFilter === 'zero') matchesRelease = pct === 0;
    else if (releasePercentageFilter === 'partial') matchesRelease = pct > 0 && pct < 100;
    else if (releasePercentageFilter === 'full') matchesRelease = pct >= 99.9; // Handling float precision

    return matchesSearch && matchesStatus && matchesRelease;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getFulfilmentLabel = (app: PaymentApplication) => {
    if (app.payment_proof_path) return 'Proof Uploaded';
    if (app.utr_number) return 'UTR Added';
    if (app.voucher_number) return 'Voucher Ready';
    return 'Awaiting Voucher';
  };

  const getFulfilmentColor = (app: PaymentApplication) => {
    if (app.payment_proof_path) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800';
    if (app.utr_number) return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800';
    if (app.voucher_number) return 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800';
    return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800';
  };

  const canAccountProcess = ['accountant', 'admin', 'super_admin', 'pdd_manager'].includes(user?.role || '');
  const isAccountant = user?.role === 'accountant';

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-shadow-sm">Payment Applications</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Manage and track your funding requests</p>
        </div>
        
        {(user?.role === 'employee' || user?.role === 'manager' || user?.role === 'super_admin') && (
          <Button 
            onClick={() => navigate('/payments/new')}
            className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl"
          >
            <Plus size={16} />
            New Application
          </Button>
        )}
      </div>

      <MobilePageSwitcher options={appSwitcherOptions} activeLabel="Application List" />

      {/* Eligible Loans Quick Start */}
      {eligibleLoans.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Loans Ready for Payment
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
              {eligibleLoans.length} files available
            </span>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-1 px-1">
            {eligibleLoans.map((loan) => (
              <div 
                key={loan.id} 
                className="flex-shrink-0 w-72 glass-card p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 hover:border-blue-400 transition-all group cursor-pointer shadow-sm hover:shadow-md bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10"
                onClick={() => navigate(`/payments/loan/${loan.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter ${loan.status === 'disbursed' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                    {loan.status === 'disbursed' ? 'Part Payment' : 'New Release'}
                  </Badge>
                  <p className="text-[10px] font-mono text-gray-400">#{loan.loan_number}</p>
                </div>
                
                <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1 group-hover:text-blue-600 transition-colors">
                  {loan.customer_name || loan.applicant_name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                  <User size={12} className="text-blue-400" />
                  {loan.mobile}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-blue-100/50 dark:border-blue-800/30">
                   <div className="text-[10px] text-gray-400 italic">
                      {loan.maker_name} {loan.model_variant_name}
                   </div>
                   <button className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Start Request
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm min-w-[150px]"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="manager_approved">Manager Approved</option>
          <option value="manager_rejected">Manager Rejected</option>
          <option value="account_processing">Account Processing</option>
          <option value="voucher_created">Voucher Created</option>
          <option value="payment_released">Payment Released</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Release Percentage Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100/50 dark:bg-slate-900/30 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: 'All', icon: <Layers size={14} /> },
          { id: 'zero', label: '0% Released', icon: <CircleDashed size={14} /> },
          { id: 'partial', label: '1-99%', icon: <PieChart size={14} /> },
          { id: 'full', label: '100% Full', icon: <CheckCircle2 size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReleasePercentageFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              releasePercentageFilter === tab.id
                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-blue-100 dark:border-blue-900/40'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <input
        type="file"
        id="proof-upload"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingForId) {
            handleUploadProof(uploadingForId, file);
          }
        }}
        accept="image/*,.pdf"
      />

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-white/20 dark:border-white/10 shadow-sm">
          <div className="flex flex-col items-center justify-center max-w-[300px] mx-auto">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
              <FileCheck className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Applications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              When you create payment requests, they will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {filteredApplications.map((app) => (
              <div key={app.id} className="glass-card p-5 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => navigate(`/payments/${app.id}`)}>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  {(() => {
                    const appPct = (Number(app.old_release_amount || app.total_release_amount) || 0) / (Number(app.disbursement_amount) || 1) * 100;
                    const actualStatus = (app.status === 'completed' && appPct < 99) ? 'payment_released' : app.status;
                    return (
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(actualStatus)}`}>
                        {actualStatus.replace('_', ' ')}
                      </div>
                    );
                  })()}
                  <div className="text-[10px] text-gray-500 font-mono italic">#{app.id.toString().padStart(4, '0')}</div>
                </div>
                
                <div className="space-y-4 mb-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-0.5">{app.applicant_name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                        <User size={12} className="text-blue-500" /> {app.applicant_phone}
                      </p>
                      {app.created_by_name && (
                         <p className="text-[10px] text-gray-400">Created by: {app.created_by_name}</p>
                      )}
                      {app.approved_by_name && (
                         <p className="text-[10px] text-gray-500 font-medium">Approved by: {app.approved_by_name} {app.approved_at && `at ${new Date(app.approved_at).toLocaleDateString()}`}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 italic mb-1">{new Date(app.created_at).toLocaleString()}</p>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block uppercase ${getFulfilmentColor(app)}`}>
                        {getFulfilmentLabel(app)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 dark:border-gray-800">
                     <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Vehicle</p>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{app.vehicle_name} {app.vehicle_model}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{app.vehicle_number}</p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Financier</p>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{app.bank_name || app.financier_name || 'N/A'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{app.financier_name || app.disbursement_branch || 'N/A'}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(app.payment_amount || 0)}</p>
                      {app.emi_amount && <p className="text-[10px] font-medium text-gray-500">EMI: ₹{Number(app.emi_amount).toLocaleString()}/mo</p>}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium italic">
                      <Receipt size={10} className="text-blue-500" />
                      {app.payment_purpose || 'Standard Disbursement'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 relative z-10" onClick={e => e.stopPropagation()}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1.5 rounded-xl text-[11px] h-9 min-w-[80px]"
                    onClick={() => navigate(`/payments/${app.id}`)}
                  >
                    <Eye size={14} />
                    View
                  </Button>
                  
                  {(user?.role === 'employee' || user?.role === 'manager' || user?.role === 'super_admin') && (app.status === 'draft' || app.status === 'sent_back') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1.5 rounded-xl text-[11px] h-9 min-w-[80px]"
                      onClick={() => navigate(`/payments/edit/${app.id}`)}
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                  )}
                  
                  {(user?.role === 'rbm' || user?.role === 'admin' || user?.role === 'super_admin') && app.status === 'submitted' && (
                    <>
                      <Button 
                        size="sm" 
                        className="flex-1 gap-1.5 rounded-xl text-[11px] h-9 bg-green-600 hover:bg-green-700 min-w-[80px]"
                        onClick={() => handleManagerAction(app.id, 'approve')}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={14} />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1 gap-1.5 rounded-xl text-[11px] h-9 min-w-[80px]"
                        onClick={() => handleManagerAction(app.id, 'reject')}
                        disabled={actionLoading}
                      >
                        <X size={14} />
                        Reject
                      </Button>
                    </>
                  )}

                  {canAccountProcess && app.status === 'manager_approved' && (
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1.5 rounded-xl text-[11px] h-9 bg-purple-600 hover:bg-purple-700 min-w-[110px]"
                      onClick={() => navigate(`/account/vouchers/create/${app.id}`)}
                    >
                      <FileText size={14} />
                      Generate Voucher
                    </Button>
                  )}

                  {canAccountProcess && app.status === 'voucher_created' && (
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1.5 rounded-xl text-[11px] h-9 bg-blue-600 hover:bg-blue-700 min-w-[90px]"
                      onClick={() => navigate(`/payments/${app.id}`)}
                    >
                      <CreditCard size={14} />
                      Add UTR
                    </Button>
                  )}

                  {canAccountProcess && app.status === 'payment_released' && (
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1.5 rounded-xl text-[11px] h-9 bg-emerald-600 hover:bg-emerald-700 min-w-[110px]"
                      onClick={() => navigate(`/payments/${app.id}`)}
                    >
                      <Download size={14} />
                      Upload Proof
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loan / ID</th>
                    {!isAccountant && <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date & Time</th>}
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Applicant</th>
                    {!isAccountant && <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vehicle</th>}
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bank</th>
                    {!isAccountant && <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Branch</th>}
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                    {!isAccountant && <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">EMI</th>}
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Release %</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">PDD</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => navigate(`/payments/${app.id}`)}>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white text-[11px] leading-tight">{app.loan_number}</div>
                        <div className="text-[10px] text-gray-400 italic">ID: #{app.id.toString().padStart(4, '0')}</div>
                        {isAccountant && (
                          <div className="text-[10px] text-gray-500 mt-1">
                            Approved by: <span className="font-medium text-gray-700 dark:text-gray-300">{app.approved_by_name || 'N/A'}</span>
                            {app.approved_at && (
                              <div className="text-[9px] text-gray-400 mt-0.5">
                                at {new Date(app.approved_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      {!isAccountant && (
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                            {new Date(app.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white text-[11px]">{app.applicant_name}</div>
                        <div className="text-[10px] text-blue-600 font-medium">{app.applicant_phone}</div>
                      </td>
                      {!isAccountant && (
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">
                            {app.vehicle_name} {app.vehicle_model}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">{app.vehicle_number}</div>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-[11px] text-gray-700 dark:text-gray-300">
                        {app.bank_name || app.financier_name || 'N/A'}
                      </td>
                      {!isAccountant && (
                        <td className="px-3 py-3 whitespace-nowrap text-[11px] text-gray-700 dark:text-gray-300">
                          {app.financier_name || app.disbursement_branch || 'N/A'}
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-[11px] font-extrabold text-blue-700 dark:text-blue-400">
                        {formatCurrency(app.payment_amount || 0)}
                      </td>
                      {!isAccountant && (
                        <td className="px-3 py-3 whitespace-nowrap text-[11px] text-gray-600 dark:text-gray-400">
                          {app.emi_amount ? `₹${Number(app.emi_amount).toLocaleString()}/mo` : 'N/A'}
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {(() => {
                          const total = Number(app.disbursement_amount) || 0;
                          const released = Number(app.old_release_amount) || 0;
                          const pct = total > 0 ? Math.round((released / total) * 100) : 0;
                          return (
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-extrabold ${pct >= 100 ? 'text-green-600' : pct > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                {pct}%
                              </span>
                              <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {(() => {
                          const appPct = (Number(app.old_release_amount || app.total_release_amount) || 0) / (Number(app.disbursement_amount) || 1) * 100;
                          const actualStatus = (app.status === 'completed' && appPct < 99) ? 'payment_released' : app.status;
                          return (
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(actualStatus)}`}>
                              {actualStatus.replace('_', ' ')}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                         <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${getFulfilmentColor(app)}`}>
                            {getFulfilmentLabel(app)}
                         </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => navigate(`/payments/${app.id}`)}>
                            <Eye size={14} />
                          </Button>
                          
                          {(user?.role === 'employee' || user?.role === 'manager' || user?.role === 'super_admin') && (app.status === 'draft' || app.status === 'sent_back') && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => navigate(`/payments/edit/${app.id}`)}>
                              <Edit size={14} />
                            </Button>
                          )}
                          
                          {(user?.role === 'rbm' || user?.role === 'admin' || user?.role === 'super_admin') && app.status === 'submitted' && (
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleManagerAction(app.id, 'approve')}>
                                <CheckCircle size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleManagerAction(app.id, 'reject')}>
                                <X size={14} />
                              </Button>
                            </div>
                          )}

                          {canAccountProcess && app.status === 'manager_approved' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-purple-600 font-bold text-[9px] uppercase tracking-wider"
                              onClick={() => navigate(`/account/vouchers/create/${app.id}`)}
                            >
                              Voucher
                            </Button>
                          )}

                          {canAccountProcess && app.status === 'voucher_created' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-blue-600 font-bold text-[9px] uppercase tracking-wider"
                              onClick={() => navigate(`/payments/${app.id}`)}
                            >
                              UTR
                            </Button>
                          )}

                          {canAccountProcess && app.status === 'payment_released' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-emerald-600 font-bold text-[9px] uppercase tracking-wider"
                              onClick={() => navigate(`/payments/${app.id}`)}
                            >
                              Proof
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

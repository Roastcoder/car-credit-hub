import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Plus, Search, Filter, Eye, Edit, CheckCircle, X,
  Clock, FileText, CreditCard, AlertCircle, Download
} from 'lucide-react';
import { paymentApplicationAPI } from '@/lib/api';

interface PaymentApplication {
  id: number;
  loan_id: string;
  loan_number: string;
  applicant_name: string;
  payment_amount: number;
  payment_purpose: string;
  status: 'draft' | 'submitted' | 'manager_approved' | 'manager_rejected' | 'account_processing' | 'voucher_created' | 'payment_released' | 'completed';
  created_at: string;
  created_by: number;
  approved_by?: number;
  processed_by?: number;
  utr_number?: string;
  payment_proof_path?: string;
}

export default function PaymentApplicationsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<PaymentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<PaymentApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);
  const [uploadingForId, setUploadingForId] = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

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
      setSelectedApp(null);
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error(`Failed to ${action} application`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVoucher = (applicationId: number) => {
    navigate(`/account/vouchers/create/${applicationId}`);
  };

  const handleAddUTR = async (applicationId: number, utrNumber: string) => {
    try {
      await paymentApplicationAPI.addUTR(applicationId, utrNumber);
      toast.success('UTR number added successfully. Now please upload the payment proof.');
      fetchApplications();
    } catch (error) {
      console.error('Error adding UTR:', error);
      toast.error('Failed to add UTR number');
    }
  };

  const handleUploadProof = async (applicationId: number, file: File) => {
    try {
      setActionLoading(true);
      await paymentApplicationAPI.uploadProof(applicationId, file);
      
      toast.success('Payment proof uploaded successfully and status updated to COMPLETED');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={16} />;
      case 'submitted': return <Clock size={16} />;
      case 'manager_approved': return <CheckCircle size={16} />;
      case 'manager_rejected': return <X size={16} />;
      case 'account_processing': return <CreditCard size={16} />;
      case 'voucher_created': return <FileText size={16} />;
      case 'payment_released': return <Download size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const canManagerApprove = (app: PaymentApplication) => {
    return user?.role === 'manager' && app.status === 'submitted';
  };

  const canAccountProcess = (app: PaymentApplication) => {
    return (user?.role === 'accountant' || user?.role === 'super_admin') && app.status === 'manager_approved';
  };

  const canAddUTR = (app: PaymentApplication) => {
    return (user?.role === 'accountant' || user?.role === 'super_admin' || user?.role === 'admin') && app.status === 'voucher_created';
  };

  const canUploadProof = (app: PaymentApplication) => {
    return (user?.role === 'accountant' || user?.role === 'super_admin' || user?.role === 'admin') && app.status === 'payment_released';
  };

  const canEdit = (app: PaymentApplication) => {
    // Super admins and Administrators can edit anything
    if (user?.role === 'super_admin' || user?.role === 'admin') return true;
    
    // Accountants can edit applications that are approved or in processing to fix details
    if (user?.role === 'accountant') {
      const accountantEditable = ['submitted', 'manager_approved', 'account_processing'];
      return accountantEditable.includes(app.status);
    }

    // Original creator can only edit drafts or rejected apps
    const editableStatuses = ['draft', 'manager_rejected'];
    return editableStatuses.includes(app.status) && user?.id === app.created_by;
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.loan_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage payment applications and workflow</p>
        </div>
        {(user?.role === 'employee' || user?.role === 'manager' || user?.role === 'super_admin') && (
          <button
            onClick={() => navigate('/payments/applications/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Application
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

      {/* Applications List */}
      <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No payment applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">#{app.id}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{app.loan_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{app.applicant_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-white">₹{app.payment_amount?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600 dark:text-gray-400">{app.payment_purpose}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        {app.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/payments/${app.id}`)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {canEdit(app) && (
                          <button
                            onClick={() => navigate(`/payments/applications/edit/${app.id}`)}
                            className="p-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                            title="Edit Application"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        
                        {canManagerApprove(app) && (
                          <>
                            <button
                              onClick={() => handleManagerAction(app.id, 'approve')}
                              disabled={actionLoading}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleManagerAction(app.id, 'reject')}
                              disabled={actionLoading}
                              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        
                        {canAccountProcess(app) && (
                          <button
                            onClick={() => handleCreateVoucher(app.id)}
                            className="p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Create Voucher"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        
                        {canAddUTR(app) && !app.utr_number && (
                          <button
                            onClick={() => {
                              const utr = prompt('Enter UTR Number:');
                              if (utr) handleAddUTR(app.id, utr);
                            }}
                            className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Add UTR Number"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}

                        {canUploadProof(app) && (
                          <button
                            onClick={() => {
                              setUploadingForId(app.id);
                              document.getElementById('proof-upload')?.click();
                            }}
                            className="p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Upload Payment Proof"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        
                        {app.utr_number && (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">UTR Number</span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              {app.utr_number}
                            </span>
                          </div>
                        )}

                        {app.payment_proof_path && (
                          <a
                            href={`${import.meta.env.VITE_API_URL}${app.payment_proof_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View Payment Proof"
                          >
                            <FileText size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
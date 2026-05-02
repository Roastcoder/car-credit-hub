import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Database, Search, ArrowRight, User, FileText,
  Users, Building2, CreditCard, ShieldCheck,
  Briefcase, GraduationCap, LayoutList, History,
  Table as TableIcon, ChevronRight
} from 'lucide-react';
import { legacyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

const ARCHIVE_TABLES = [
  { id: 'loanfile', label: 'Loan Files', icon: FileText, color: 'text-blue-500' },
  { id: 'customers', label: 'Customers', icon: User, color: 'text-emerald-500' },
  { id: 'dsa', label: 'Brokers / DSA', icon: Building2, color: 'text-purple-500' },
  { id: 'dsa_payout', label: 'Payouts', icon: CreditCard, color: 'text-amber-500' },
  { id: 'pdd', label: 'PDD Records', icon: ShieldCheck, color: 'text-rose-500' },
  { id: 'employees', label: 'Employees', icon: Users, color: 'text-indigo-500' },
  { id: 'schemes', label: 'Loan Schemes', icon: LayoutList, color: 'text-cyan-500' },
  { id: 'users', label: 'System Users', icon: ShieldCheck, color: 'text-slate-500' },
  { id: 'associates', label: 'Associates', icon: Briefcase, color: 'text-orange-500' },
  { id: 'financier', label: 'Financiers', icon: GraduationCap, color: 'text-pink-500' },
];

export default function LegacyData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTable, setActiveTable] = useState(searchParams.get('tab') || 'loanfile');

  // Sync activeTable with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTable) {
      setActiveTable(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes internally (if any)
  const handleTabChange = (tabId: string) => {
    setActiveTable(tabId);
    setSearchParams({ tab: tabId });
  };

  const { data: stats } = useQuery({
    queryKey: ['legacy-stats'],
    queryFn: () => legacyAPI.getStats()
  });

  const { data: tableData, isLoading } = useQuery({
    queryKey: ['legacy-table', activeTable],
    queryFn: () => legacyAPI.getTableData(activeTable),
  });

  const handleShowDetails = (item: any) => {
    const id = item.iLoanId || item.iCustomerId || item.id || item.ipddId || item.iDsapayoutId || item.iEmployeeId || item.iSchemesId || item.iAssociatesId || item.iFinancierId;
    navigate(`/legacy-archive/${activeTable}/${id}`);
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  };

  const filteredData = tableData?.data?.filter((item: any) => {
    if (!searchTerm) return true;
    return Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Archive Data");

    const tableName = ARCHIVE_TABLES.find(t => t.id === activeTable)?.label || activeTable;
    XLSX.writeFile(wb, `Legacy_${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col gap-6 overflow-hidden">
      {/* Search & Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3 mr-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
              {ARCHIVE_TABLES.find(t => t.id === activeTable)?.label || 'Legacy Archive'}
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Historical Archive Explorer</p>
          </div>
        </div>

        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder={`Search across all fields in ${ARCHIVE_TABLES.find(t => t.id === activeTable)?.label}...`} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl h-11"
          />
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 text-slate-600 font-black">
            {filteredData.length} Records
          </Badge>
          
          <Button 
            variant="outline" 
            className="rounded-xl h-11 border-slate-200 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all font-bold"
            onClick={handleExport}
            disabled={filteredData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export XLS
          </Button>
        </div>
      </div>

      {/* Full-width Data Table */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">S.No</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status / Additional Info</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-6 h-16 bg-slate-50/20 dark:bg-slate-900/20" />
                  </tr>
                ))
              ) : filteredData.map((item: any, idx: number) => (
                <tr 
                  key={idx} 
                  onClick={() => handleShowDetails(item)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-400">{idx + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {item.customer_name || item.employee_name || item.schemes_name || item.name || 
                       item.vEmployeeName || item.vSchemeName || item.vDsaName || item.firstname ||
                       item.financier_name_in_m_parivahan || item.vAssociateName || item.vFinancierName || 
                       item.financier_name || item.username || (item.loanfile_no ? `Payout for File #${item.loanfile_no}` : null) ||
                       item.vLoanNumber || item.file_no || 
                       `Record #${item.iLoanId || item.iCustomerId || item.id || item.ipddId || item.iDsapayoutId || item.iEmployeeId || item.iSchemesId || item.iAssociatesId || item.iFinancierId}`}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-lg">
                      {item.mobile_no || item.phone || item.vMobileNo || item.email || item.vEmail || 
                       item.vAddress || item.current_address || item.address || 
                       (item.loan_id ? `Loan ID: ${item.loan_id}` : null) ||
                       (item.username ? `@${item.username}` : 'No additional contact info')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(item.loan_amount || item.fLoanAmount || item.fAmount || item.amount || item.payout_amount || item.loan_amount_required) && (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50">
                          {formatCurrency(item.loan_amount || item.fLoanAmount || item.fAmount || item.amount || item.payout_amount || item.loan_amount_required)}
                        </Badge>
                      )}
                      {(item.file_status || item.vStatus || item.status || item.rto_work_status || item.paid_status || item.active !== undefined) && (
                        <Badge className={cn(
                          "text-[10px] border-none font-black",
                          (item.file_status === 'Approved' || item.vStatus === 'Active' || item.active === 1 || item.paid_status === 'Paid') ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}>
                          {item.file_status || item.vStatus || item.status || item.rto_work_status || item.paid_status || (item.active === 1 ? 'Active' : 'Inactive')}
                        </Badge>
                      )}
                      {(item.district || item.vCity || item.city || item.our_branch || item.dto_location) && (
                        <span className="text-xs text-slate-400 font-medium">{item.district || item.vCity || item.city || item.our_branch || item.dto_location}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:text-amber-600 group/btn"
                      onClick={() => handleShowDetails(item)}
                    >
                      <span className="mr-2 font-bold text-[10px] uppercase tracking-wider group-hover/btn:translate-x-[-2px] transition-transform inline-block">Full Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
                <TableIcon className="h-12 w-12 opacity-20" />
              </div>
              <p className="font-black uppercase tracking-widest text-xs">No records found matching your search</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

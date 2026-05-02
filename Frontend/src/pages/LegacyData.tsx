import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTable, setActiveTable] = useState('loanfile');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['legacy-stats'],
    queryFn: () => legacyAPI.getStats()
  });

  const { data: tableData, isLoading } = useQuery({
    queryKey: ['legacy-table', activeTable],
    queryFn: () => legacyAPI.getTableData(activeTable),
  });

  const handleShowDetails = (item: any) => {
    const id = item.iLoanId || item.iCustomerId || item.id || item.iAssociatesId;
    window.open(`/legacy-archive/${activeTable}/${id}`, '_blank');
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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 p-6">
      {/* Sidebar Navigation */}
      <div className="w-72 flex flex-col gap-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Legacy Archive</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Historical MySQL Data Explorer</p>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-1.5">
            {ARCHIVE_TABLES.map((table) => {
              const Icon = table.icon;
              const isActive = activeTable === table.id;
              
              return (
                <button
                  key={table.id}
                  onClick={() => setActiveTable(table.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isActive ? "bg-slate-100 dark:bg-slate-800" : "bg-transparent group-hover:bg-white dark:group-hover:bg-slate-800"
                    )}>
                      <Icon className={cn("h-4 w-4", isActive ? table.color : "text-slate-400")} />
                    </div>
                    <span className={cn("text-sm font-bold", isActive ? "text-slate-900 dark:text-white" : "")}>
                      {table.label}
                    </span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Stats Summary */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Records</p>
            <History className="h-3 w-3 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold mb-1">Loans</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{stats?.data?.totalLoans || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold mb-1">Customers</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{stats?.data?.totalCustomers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={`Search in ${ARCHIVE_TABLES.find(t => t.id === activeTable)?.label}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl"
            />
          </div>
          <Badge variant="outline" className="px-4 py-1.5 border-slate-200 dark:border-slate-800">
            {filteredData.length} Records Found
          </Badge>
        </div>

        {/* Data Table */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <ScrollArea className="flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-sm">
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">S.No</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status / Additional Info</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-6 h-16 bg-slate-50/50 dark:bg-slate-900/50" />
                    </tr>
                  ))
                ) : filteredData.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-400">{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                        {item.customer_name || item.vCustomerName || item.vFirstName || item.vLoanNumber || item.name || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">
                        {item.mobile_no || item.phone || item.vMobileNo || item.email || item.vEmail || 'No contact info'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.loan_amount && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                            {formatCurrency(item.loan_amount)}
                          </Badge>
                        )}
                        {item.file_status && (
                          <Badge className={cn(
                            "text-[10px] border-none",
                            item.file_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          )}>
                            {item.file_status}
                          </Badge>
                        )}
                        {item.district && <span className="text-xs text-slate-400">{item.district}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                        onClick={() => handleShowDetails(item)}
                      >
                        Full Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <TableIcon className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold">No records found matching your search</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

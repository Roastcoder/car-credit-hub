import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Search, Filter, ArrowRight, User, FileText, BarChart3, Clock, MapPin, Phone } from 'lucide-react';
import { legacyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LegacyData() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('loans');

  const { data: stats } = useQuery({
    queryKey: ['legacy-stats'],
    queryFn: () => legacyAPI.getStats()
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['legacy-loans', searchTerm],
    queryFn: () => legacyAPI.getLoans({ search: searchTerm }),
    enabled: activeTab === 'loans'
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['legacy-customers'],
    queryFn: () => legacyAPI.getCustomers(),
    enabled: activeTab === 'customers'
  });

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Legacy Archive</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Migrated historical data from previous MySQL system</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Loans</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats?.data?.totalLoans || 0}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Customers</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats?.data?.totalCustomers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <TabsList className="bg-transparent border-none">
            <TabsTrigger value="loans" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl px-6 py-2">
              <FileText className="h-4 w-4 mr-2" />
              Loan Files
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl px-6 py-2">
              <User className="h-4 w-4 mr-2" />
              Customer Records
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search legacy records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
        </div>

        <TabsContent value="loans">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loansLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700" />
              ))
            ) : loans?.data?.map((loan: any) => (
              <div key={loan.iLoanId} className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mb-2">
                      #{loan.iLoanId}
                    </Badge>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {loan.vCustomerName || 'N/A'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Loan Amount</p>
                    <p className="font-black text-slate-900 dark:text-white">{formatCurrency(loan.fLoanAmount)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5 mr-2" />
                    {loan.vMobileNo || 'No phone'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 mr-2" />
                    {loan.vAddress || 'No address'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 mr-2" />
                    Created: {new Date(loan.create_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Badge className={
                    loan.file_status === 'Approved' ? 'bg-green-100 text-green-700' : 
                    loan.file_status === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                    'bg-slate-100 text-slate-700'
                  }>
                    {loan.file_status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="group/btn text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                    Details
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customersLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6 h-16 bg-slate-50/50" />
                    </tr>
                  ))
                ) : customers?.data?.map((customer: any) => (
                  <tr key={customer.iCustomerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-400">#{customer.iCustomerId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                        {customer.vFirstName} {customer.vLastName}
                      </p>
                      <p className="text-xs text-slate-500">{customer.vEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{customer.vMobileNo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{customer.vCity}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px]">
                        {customer.vCustomerType || 'Standard'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-amber-600">
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

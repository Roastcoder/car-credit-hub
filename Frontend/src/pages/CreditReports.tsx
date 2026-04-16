import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, Filter, Trash2, ExternalLink, RefreshCw, FileText, User, Calendar, CreditCard, ChevronRight, Download, Activity } from 'lucide-react';
import { creditReportsAPI, externalAPI, loansAPI } from '@/lib/api';
import { CREDIT_SCORE_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

export default function CreditReports() {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Fetch form state
  const [fetchForm, setFetchForm] = useState({
    provider: 'CIBIL',
    name: '',
    mobile: '',
    identifier_type: 'pan',
    identifier_value: '',
    loan_id: '',
    gender: 'male'
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await creditReportsAPI.getAll();
      setReports(data);
    } catch (error: any) {
      toast.error('Failed to fetch credit reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    
    // Handle query params for triggering a fetch
    const loan_id = searchParams.get('loan_id');
    const name = searchParams.get('name');
    const mobile = searchParams.get('mobile');
    const pan = searchParams.get('pan');
    const gender = searchParams.get('gender');

    if (loan_id || name || mobile || pan) {
      setFetchForm(prev => ({
        ...prev,
        loan_id: loan_id || '',
        name: name || '',
        mobile: mobile || '',
        identifier_value: pan || '',
        identifier_type: pan ? 'pan' : 'aadhaar',
        gender: (gender?.toLowerCase() === 'female' ? 'female' : 'male')
      }));
      setIsFetchModalOpen(true);
    }
  }, [searchParams]);

  const handleFetchReport = async () => {
    if (!fetchForm.name || !fetchForm.mobile || !fetchForm.identifier_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsFetching(true);
      
      const payload: any = {
        provider: fetchForm.provider,
        name: fetchForm.name,
        mobile: fetchForm.mobile,
        loan_id: fetchForm.loan_id || undefined,
        gender: fetchForm.gender
      };

      if (fetchForm.identifier_type === 'pan') {
        payload.pan = fetchForm.identifier_value;
      } else {
        payload.aadhaar = fetchForm.identifier_value;
        payload.id_number = fetchForm.identifier_value;
        payload.id_type = 'aadhaar';
      }

      const result = await externalAPI.fetchCreditReport(payload);
      
      if (result.success) {
        toast.success(`Report fetched successfully! Score: ${result.data.credit_score}`);
        setIsFetchModalOpen(false);
        fetchReports(); // Refresh the list
        
        // Reset form
        setFetchForm({
          provider: 'CIBIL',
          name: '',
          mobile: '',
          identifier_type: 'pan',
          identifier_value: '',
          loan_id: '',
          gender: 'male'
        });
      } else {
        toast.error(result.message || 'Failed to fetch report');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error fetching credit report');
    } finally {
      setIsFetching(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await creditReportsAPI.delete(id);
      toast.success('Report deleted');
      fetchReports();
    } catch (error: any) {
      toast.error('Failed to delete report');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.loan_customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.provider?.toLowerCase().includes(search.toLowerCase());
    
    const matchesProvider = providerFilter === 'all' || r.provider === providerFilter;
    
    return matchesSearch && matchesProvider;
  });

  const getScoreColor = (score: string | number) => {
    const s = Number(score);
    if (!s) return 'bg-slate-100 text-slate-600';
    if (s >= 750) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s >= 700) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s >= 600) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600 h-7 w-7" />
            Credit Report Management
          </h1>
          <p className="text-slate-500 mt-1">Monitor and fetch customer credit history securely.</p>
        </div>

        <Dialog open={isFetchModalOpen} onOpenChange={setIsFetchModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95 gap-2 rounded-xl">
              <RefreshCw className="h-4 w-4" />
              Fetch New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-blue-600 h-5 w-5" />
                Fetch Credit Report
              </DialogTitle>
              <DialogDescription>
                Fetch a real-time report from Surepass. This will be automatically saved.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Provider</label>
                  <Select 
                    value={fetchForm.provider} 
                    onValueChange={(v) => setFetchForm({...fetchForm, provider: v})}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDIT_SCORE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</label>
                  <Select 
                    value={fetchForm.gender} 
                    onValueChange={(v) => setFetchForm({...fetchForm, gender: v})}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Full Name (as per ID)</label>
                <Input 
                  placeholder="e.g. Vishal Rathore" 
                  className="rounded-xl border-slate-200"
                  value={fetchForm.name}
                  onChange={(e) => setFetchForm({...fetchForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mobile Number</label>
                  <Input 
                    placeholder="10-digit mobile" 
                    maxLength={10}
                    className="rounded-xl border-slate-200"
                    value={fetchForm.mobile}
                    onChange={(e) => setFetchForm({...fetchForm, mobile: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Loan ID (Optional)</label>
                  <Input 
                    placeholder="Auto-save to loan" 
                    className="rounded-xl border-slate-200"
                    value={fetchForm.loan_id}
                    onChange={(e) => setFetchForm({...fetchForm, loan_id: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Identifier</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setFetchForm({...fetchForm, identifier_type: 'pan'})}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${fetchForm.identifier_type === 'pan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >PAN</button>
                    <button 
                      onClick={() => setFetchForm({...fetchForm, identifier_type: 'aadhaar'})}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${fetchForm.identifier_type === 'aadhaar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >AADHAAR</button>
                  </div>
                </div>
                <Input 
                  placeholder={fetchForm.identifier_type === 'pan' ? "e.g. ABCDE1234F" : "12-digit Aadhaar"} 
                  className="rounded-xl border-slate-200 font-mono"
                  value={fetchForm.identifier_value}
                  onChange={(e) => setFetchForm({...fetchForm, identifier_value: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                className="w-full rounded-xl h-12 text-md font-bold bg-blue-600 hover:bg-blue-700" 
                onClick={handleFetchReport}
                disabled={isFetching}
              >
                {isFetching ? (
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                {isFetching ? 'Fetching Data...' : 'Confirm & Fetch Report'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-bold">Historical Records</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search reports..." 
                      className="pl-9 rounded-xl border-slate-200 h-9 text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="w-32 rounded-xl border-slate-200 h-9 text-sm">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        <SelectValue placeholder="Provider" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {CREDIT_SCORE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="bg-slate-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-bold">No reports found</p>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or fetch a new report.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/30 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Customer / Loan</th>
                        <th className="px-6 py-4">Provider</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 leading-tight">{report.loan_customer_name}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">#{report.loan_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="rounded-lg border-slate-200 bg-white shadow-sm font-bold text-[10px] uppercase">
                              {report.provider}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex px-3 py-1.5 rounded-xl font-black text-sm border shadow-sm ${getScoreColor(report.score)}`}>
                              {report.score || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs font-medium">{format(new Date(report.created_at), 'dd MMM yyyy')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {report.report_link && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  onClick={() => window.open(report.report_link, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
                                onClick={() => handleDelete(report.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl border-blue-100 bg-blue-50/30 overflow-hidden">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900 uppercase tracking-wider">
                <Activity className="h-4 w-4 text-blue-600" />
                Risk Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Average Score</span>
                  <Badge className="bg-emerald-500">GOOD</Badge>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {reports.length > 0 
                    ? Math.round(reports.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / (reports.filter(r => !!Number(r.score)).length || 1))
                    : 0
                  }
                </div>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Higher scores indicate lower credit risk. Records are strictly accessible to superadmins for privacy compliance.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="p-5 bg-slate-50 text-slate-900">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Legend</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-bold text-slate-700">Excellent (750+)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-slate-700">Good (700-749)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-700">Average (600-699)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-slate-700">Poor (Below 600)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, Filter, Trash2, ExternalLink, RefreshCw, FileText, User, Calendar, CreditCard, ChevronRight, Download, Activity } from 'lucide-react';
import { creditReportsAPI, externalAPI, loansAPI } from '@/lib/api';
import { CREDIT_SCORE_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import { FetchCreditModal } from '@/components/FetchCreditModal';
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
import { CreditScoreGauge } from '@/components/CreditScoreGauge';
import { getFileUrl } from '@/lib/utils';

export default function CreditReports() {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [initialFetchData, setInitialFetchData] = useState<any>(null);

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

    const lead_id = searchParams.get('lead_id');

    if (loan_id || lead_id || name || mobile || pan) {
      setInitialFetchData({
        loan_id: loan_id || '',
        lead_id: lead_id || '',
        name: name || '',
        mobile: mobile || '',
        pan: pan || '',
        gender: gender || 'male'
      });
      setIsFetchModalOpen(true);
    }
  }, [searchParams]);


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
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      (r.loan_customer_name || '').toLowerCase().includes(searchLower) ||
      (r.lead_customer_name || '').toLowerCase().includes(searchLower) ||
      (r.loan_number || '').toLowerCase().includes(searchLower) ||
      (r.provider || '').toLowerCase().includes(searchLower);
    
    const matchesProvider = providerFilter === 'all' || r.provider === providerFilter;
    
    return matchesSearch && matchesProvider;
  });

  const latestReport = reports.length > 0 ? reports[0] : null;

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

        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95 gap-2 rounded-xl"
          onClick={() => {
            setInitialFetchData(null);
            setIsFetchModalOpen(true);
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Fetch New Report
        </Button>
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
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0">
                          <CreditScoreGauge 
                            score={latestReport?.score || 300} 
                            size="lg" 
                            className="scale-90 md:scale-100"
                          />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Latest Analysis</h3>
                            <p className="text-slate-500 text-sm font-medium">
                              {latestReport 
                                ? `Last report for ${latestReport.loan_customer_name || latestReport.lead_customer_name || 'customer'} fetched on ${format(new Date(latestReport.created_at), 'dd MMM yyyy')}`
                                : 'No reports available yet. Fetch a new report to see analysis.'
                              }
                            </p>
                          </div>
                          
                          {latestReport && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider</p>
                                <p className="text-sm font-bold text-slate-900">{latestReport.provider}</p>
                              </div>
                              <div className="bg-white/50 p-3 rounded-xl border border-slate-100 shadow-sm text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                <Badge className={getScoreColor(latestReport.score)}>
                                  {Number(latestReport.score) >= 750 ? 'EXCELLENT' : 
                                   Number(latestReport.score) >= 650 ? 'GOOD' : 
                                   Number(latestReport.score) >= 550 ? 'AVERAGE' : 'POOR'}
                                </Badge>
                              </div>
                            </div>
                          )}
                          
                          <Button 
                            variant="outline" 
                            className="w-full rounded-xl border-slate-200 text-slate-700 font-bold h-10 hover:bg-white shadow-sm"
                            onClick={() => setIsFetchModalOpen(true)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Perform New Check
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="p-5 pb-0">
                      <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Portfolio Health</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Avg Portfolio Score</span>
                          <span className="text-lg font-black text-slate-900">
                             {reports.length > 0 
                              ? Math.round(reports.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / (reports.filter(r => !!Number(r.score)).length || 1))
                              : '0'
                            }
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full" 
                            style={{ width: `${(reports.length > 0 ? (reports.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / (reports.length * 900)) * 100 : 0)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400">Total Checks Done</span>
                          <span className="text-slate-900">{reports.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400">High Risk Leads</span>
                          <span className="text-rose-600">{reports.filter(r => Number(r.score) < 550 && r.score !== null).length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

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
                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                  {report.loan_customer_name || report.lead_customer_name || 'Unknown'}
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                  {report.loan_number ? `#${report.loan_number}` : report.lead_customer_id ? `CID: ${report.lead_customer_id}` : 'CUSTOMER'}
                                </p>
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
                                  onClick={() => window.open(getFileUrl(report.report_link), '_blank')}
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
      
      {isFetchModalOpen && (
        <FetchCreditModal
          isOpen={isFetchModalOpen}
          onClose={() => setIsFetchModalOpen(false)}
          onSuccess={() => fetchReports()}
          initialData={initialFetchData}
        />
      )}
    </div>
  );
}

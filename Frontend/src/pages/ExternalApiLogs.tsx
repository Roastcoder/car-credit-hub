import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { externalAPI } from '@/lib/api';
import { Search, Shield, Clock, ExternalLink, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ExternalApiLogs() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['external-api-logs'],
    queryFn: async () => {
      const res = await externalAPI.getLogs();
      return res.data || res;
    },
    enabled: !!user && ['admin', 'super_admin'].includes(user.role),
  });

  const filtered = logs.filter((l: any) => 
    l.identifier?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.api_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (!['admin', 'super_admin'].includes(user?.role || '')) {
    return <div className="p-10 text-center">Unauthorized access</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="text-accent" /> External API Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track RC and Challan fetch activity across the system</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Requests</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-green-500">{logs.filter((l: any) => l.status === 'success').length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Successful</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-orange-500">{logs.filter((l: any) => l.api_type === 'rc_full').length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">RC Full Verifications</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-blue-500">{new Set(logs.map((l: any) => l.identifier)).size}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Unique Vehicles</p>
        </div>
      </div>

      {/* Search */}
      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by vehicle number, employee name, or API type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-4 font-bold text-muted-foreground uppercase tracking-tight text-[10px]">Timestamp</th>
                <th className="text-left py-4 px-4 font-bold text-muted-foreground uppercase tracking-tight text-[10px]">Employee</th>
                <th className="text-left py-4 px-4 font-bold text-muted-foreground uppercase tracking-tight text-[10px]">API Type</th>
                <th className="text-left py-4 px-4 font-bold text-muted-foreground uppercase tracking-tight text-[10px]">Identifier (Vehicle)</th>
                <th className="text-left py-4 px-4 font-bold text-muted-foreground uppercase tracking-tight text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">Loading audit logs...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="py-20 text-center text-red-500">Error loading logs</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">No logs found</td></tr>
              ) : (
                filtered.map((log: any) => (
                  <tr key={log.id} className="hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{new Date(log.created_at).toLocaleDateString('en-IN')}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.created_at).toLocaleTimeString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-[10px] font-bold">
                          {log.user_name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-foreground">{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        log.api_type === 'rc_full' ? 'bg-orange-500/10 text-orange-600' :
                        log.api_type === 'challan' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-gray-500/10 text-gray-600'
                      }`}>
                        {log.api_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-black text-foreground text-xs">{log.identifier}</span>
                    </td>
                    <td className="py-4 px-4">
                      {log.status === 'success' ? (
                        <div className="flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase">
                          <CheckCircle2 size={12} /> Success
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase">
                          <AlertCircle size={12} /> Failed
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

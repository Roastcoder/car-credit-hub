import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, ArrowRight } from 'lucide-react';

export default function LeadsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', user?.branch_id],
    queryFn: async () => {
      let query = supabase.from('leads' as any).select('*');
      
      if (user?.role !== 'super_admin' && user?.role !== 'admin' && user?.branch_id) {
        query = query.eq('branch_id', user.branch_id);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const filtered = leads.filter((l: any) => 
    !search || 
    l.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone_no?.includes(search)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} leads found</p>
        </div>
        <Link to="/add-lead" className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Plus size={16} /> Add Lead
        </Link>
      </div>

      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="stat-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading leads…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                 <tr className="border-b border-border">
                   <th className="text-left py-3 px-3 font-medium text-muted-foreground">ID</th>
                   <th className="text-left py-3 px-3 font-medium text-muted-foreground">Customer</th>
                   <th className="text-left py-3 px-3 font-medium text-muted-foreground">Phone</th>
                   <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                   <th className="text-right py-3 px-3 font-medium text-muted-foreground">Loan Amount</th>
                   <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">Branch</th>
                   <th className="text-center py-3 px-3 font-medium text-muted-foreground">Status</th>
                   <th className="py-3 px-3"></th>
                 </tr>
              </thead>
              <tbody>
                {filtered.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <p className="text-xs font-mono text-accent">{lead.customer_id || '—'}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-foreground">{lead.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.district}</p>
                    </td>
                    <td className="py-3 px-3 text-foreground">{lead.phone_no}</td>
                    <td className="py-3 px-3 text-muted-foreground hidden md:table-cell">{lead.vehicle_no || '—'}</td>
                    <td className="py-3 px-3 text-right font-medium text-foreground">₹{Number(lead.loan_amount_required || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">{lead.our_branch || '—'}</td>
                    <td className="py-3 px-3 text-center">
                      {lead.converted_to_loan ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Converted</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button 
                        onClick={() => navigate(`/loans/new?leadId=${lead.id}`)}
                        className="p-1.5 rounded-lg hover:bg-accent/10 text-accent transition-colors"
                        title="Convert to Loan"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="py-12 text-center text-muted-foreground">No leads found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

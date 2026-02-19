import { useState } from 'react';
import { MOCK_LOANS, formatCurrency } from '@/lib/mock-data';
import { UserCheck, Search, Plus, TrendingUp, FileText, IndianRupee, Edit, Trash2 } from 'lucide-react';

const BROKERS = [
  { id: '1', name: 'Vikram Singh', email: 'vikram@carloan.com', phone: '9876543210', area: 'Mumbai', commissionRate: 1.5 },
  { id: '2', name: 'Rohit Kapoor', email: 'rohit@carloan.com', phone: '9812345678', area: 'Delhi NCR', commissionRate: 1.2 },
  { id: '3', name: 'Sunil Mehta', email: 'sunil@carloan.com', phone: '9988776655', area: 'Pune', commissionRate: 1.3 },
  { id: '4', name: 'Ajay Thakur', email: 'ajay@carloan.com', phone: '9654321098', area: 'Bangalore', commissionRate: 1.4 },
  { id: '5', name: 'Manoj Pandey', email: 'manoj@carloan.com', phone: '9123456789', area: 'Ahmedabad', commissionRate: 1.1 },
];

export default function BrokerManagement() {
  const [search, setSearch] = useState('');
  const filtered = BROKERS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.area.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broker Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage external sales partners</p>
        </div>
        <button className="flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Plus size={16} /> Add Broker
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><UserCheck size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{BROKERS.length}</p><p className="text-xs text-muted-foreground">Active Brokers</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><FileText size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{MOCK_LOANS.length}</p><p className="text-xs text-muted-foreground">Total Cases</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><IndianRupee size={20} className="text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{formatCurrency(125000)}</p><p className="text-xs text-muted-foreground">Pending Payouts</p></div>
        </div>
      </div>

      {/* Search */}
      <div className="stat-card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search brokers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>

      {/* Table */}
      <div className="stat-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Broker</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">Area</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Commission %</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">
                        {b.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground hidden md:table-cell">{b.area}</td>
                  <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell mono text-xs">{b.phone}</td>
                  <td className="py-3 px-3 font-medium text-accent">{b.commissionRate}%</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">Active</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Edit size={14} /></button>
                      <button className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

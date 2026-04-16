import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, Filter, Layers } from "lucide-react";
import { toast } from "sonner";
import { subventionAPI } from "@/lib/api";

interface SubventionEntry {
  id: number;
  scheme_name: string;
  model_name: string;
  bank_name: string;
  vertical: string;
  min_loan_amount: number;
  max_loan_amount: number;
  min_tenure: number;
  max_tenure: number;
  base_rate: number;
  payout_multiplier: number;
}

export default function SubventionGrid() {
  const [entries, setEntries] = useState<SubventionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const data = await subventionAPI.getAll();
      setEntries(data);
    } catch (error) {
      console.error("Error fetching subvention grid:", error);
      toast.error("Failed to load subvention grid");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await subventionAPI.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const filteredEntries = entries.filter(e =>
    e.scheme_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.vertical?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subvention Grid</h1>
          <p className="text-muted-foreground text-sm">Configure commission rules, multiplier tiers, and tenure-based payouts.</p>
        </div>
        <Button className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus size={18} />
          New Grid Entry
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search by scheme, bank or vertical..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Layers size={16} />
                Volume Tiers
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter size={16} />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Scheme / Bank</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Vertical</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Loan Range</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Tenure Range</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Base Rate</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 bg-muted/10 h-16" />
                    </tr>
                  ))
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                      No subvention rules defined yet.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{entry.scheme_name}</div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">{entry.bank_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                          {entry.vertical || "ALL"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ₹{(entry.min_loan_amount / 100000).toFixed(1)}L – ₹{(entry.max_loan_amount / 100000).toFixed(1)}L
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {entry.min_tenure}–{entry.max_tenure}m
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{entry.base_rate}%</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          ×{entry.payout_multiplier} multiplier
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Pencil size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(entry.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

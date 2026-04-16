import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Filter, Layers } from "lucide-react";
import { toast } from "sonner";
import { subventionAPI, schemesAPI, vehicleModelsAPI, banksAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubventionEntry {
  id: number;
  scheme_id: number;
  model_id: number;
  bank_id: number;
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
  
  // Lookup lists
  const [schemes, setSchemes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Partial<SubventionEntry> | null>(null);

  useEffect(() => {
    fetchEntries();
    fetchLookups();
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

  const fetchLookups = async () => {
    try {
      const [sData, mData, bData] = await Promise.all([
        schemesAPI.getAll(),
        vehicleModelsAPI.getAll(),
        banksAPI.getAll(),
      ]);
      setSchemes(sData);
      setModels(mData);
      setBanks(bData);
    } catch (error) {
      console.error("Error fetching lookups:", error);
    }
  };

  const handleOpenAdd = () => {
    setSelectedEntry({
      scheme_id: schemes[0]?.id,
      model_id: models[0]?.id,
      bank_id: banks[0]?.id,
      vertical: "",
      min_loan_amount: 0,
      max_loan_amount: 10000000,
      min_tenure: 12,
      max_tenure: 84,
      base_rate: 1.0,
      payout_multiplier: 1.0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: SubventionEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry?.scheme_id || !selectedEntry?.model_id || !selectedEntry?.bank_id) {
      toast.error("Scheme, Model, and Bank are all required");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedEntry.id) {
        await subventionAPI.update(selectedEntry.id, selectedEntry);
        toast.success("Entry updated successfully");
      } else {
        await subventionAPI.create(selectedEntry);
        toast.success("Entry created successfully");
      }
      setIsModalOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || "Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
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
        <Button onClick={handleOpenAdd} className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700">
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => handleOpenEdit(entry)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                            onClick={() => handleDelete(entry.id)}
                          >
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

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedEntry?.id ? "Edit Grid Entry" : "New Subvention Entry"}</DialogTitle>
              <DialogDescription>
                Configure how commission is calculated for this specific combination.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Scheme</Label>
                  <Select
                    value={selectedEntry?.scheme_id?.toString()}
                    onValueChange={(val) => setSelectedEntry(prev => ({ ...prev, scheme_id: parseInt(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {schemes.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Bank / NBFC</Label>
                  <Select
                    value={selectedEntry?.bank_id?.toString()}
                    onValueChange={(val) => setSelectedEntry(prev => ({ ...prev, bank_id: parseInt(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Vehicle Model</Label>
                  <Select
                    value={selectedEntry?.model_id?.toString()}
                    onValueChange={(val) => setSelectedEntry(prev => ({ ...prev, model_id: parseInt(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.make_name} {m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vertical">Vertical (Optional)</Label>
                  <Input
                    id="vertical"
                    value={selectedEntry?.vertical || ""}
                    onChange={(e) => setSelectedEntry(prev => ({ ...prev, vertical: e.target.value }))}
                    placeholder="e.g. CV, PV, TW"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_loan">Min Loan Amount (₹)</Label>
                  <Input
                    id="min_loan"
                    type="number"
                    value={selectedEntry?.min_loan_amount || 0}
                    onChange={(e) => setSelectedEntry(prev => ({ ...prev, min_loan_amount: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_loan">Max Loan Amount (₹)</Label>
                  <Input
                    id="max_loan"
                    type="number"
                    value={selectedEntry?.max_loan_amount || 0}
                    onChange={(e) => setSelectedEntry(prev => ({ ...prev, max_loan_amount: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_tenure">Min Tenure (Months)</Label>
                  <Input
                    id="min_tenure"
                    type="number"
                    value={selectedEntry?.min_tenure || 0}
                    onChange={(e) => setSelectedEntry(prev => ({ ...prev, min_tenure: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_tenure">Max Tenure (Months)</Label>
                  <Input
                    id="max_tenure"
                    type="number"
                    value={selectedEntry?.max_tenure || 0}
                    onChange={(e) => setSelectedEntry(prev => ({ ...prev, max_tenure: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="base_rate">Base Rate (%)</Label>
                  <Input
                    id="base_rate"
                    type="number"
                    step="0.01"
                    value={selectedEntry?.base_rate || 0}
                    onChange={(e) => setSelectedEntry(prev => ({ ...prev, base_rate: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payout_multiplier">Payout Multiplier</Label>
                  <Input
                    id="payout_multiplier"
                    type="number"
                    step="0.1"
                    value={selectedEntry?.payout_multiplier || 1}
                    onChange={(e) => setSelectedEntry(prev => ({ ...prev, payout_multiplier: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="border-t pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? "Saving..." : (selectedEntry?.id ? "Update Entry" : "Create Entry")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

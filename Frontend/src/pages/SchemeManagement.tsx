import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { schemesAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Scheme {
  id: number;
  name: string;
  description: string;
}

export default function SchemeManagement() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Partial<Scheme> | null>(null);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const data = await schemesAPI.getAll();
      setSchemes(data);
    } catch (error) {
      console.error("Error fetching schemes:", error);
      toast.error("Failed to load schemes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedScheme({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme?.name) {
      toast.error("Scheme name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedScheme.id) {
        await schemesAPI.update(selectedScheme.id, selectedScheme);
        toast.success("Scheme updated successfully");
      } else {
        await schemesAPI.create(selectedScheme);
        toast.success("Scheme created successfully");
      }
      setIsModalOpen(false);
      fetchSchemes();
    } catch (error: any) {
      toast.error(error.message || "Failed to save scheme");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this scheme?")) return;
    try {
      await schemesAPI.delete(id);
      setSchemes(prev => prev.filter(s => s.id !== id));
      toast.success("Scheme deleted");
    } catch {
      toast.error("Failed to delete scheme");
    }
  };

  const filteredSchemes = schemes.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheme Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage loan schemes for the subvention grid.</p>
        </div>
        <Button onClick={handleOpenAdd} className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus size={18} />
          Add Scheme
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search schemes..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Scheme Name</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Description</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="px-6 py-8 bg-muted/10 h-16" />
                    </tr>
                  ))
                ) : filteredSchemes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic">
                      No schemes found.
                    </td>
                  </tr>
                ) : (
                  filteredSchemes.map((scheme) => (
                    <tr key={scheme.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{scheme.name}</td>
                      <td className="px-6 py-4 text-muted-foreground max-w-md truncate">
                        {scheme.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => handleOpenEdit(scheme)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                            onClick={() => handleDelete(scheme.id)}
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedScheme?.id ? "Edit Scheme" : "Add New Scheme"}</DialogTitle>
              <DialogDescription>
                Enter details for the loan scheme. Schemes are used to group subvention rules.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Scheme Name</Label>
                <Input
                  id="name"
                  value={selectedScheme?.name || ""}
                  onChange={(e) => setSelectedScheme(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Standard, Scheme 5, Nil Dep"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={selectedScheme?.description || ""}
                  onChange={(e) => setSelectedScheme(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide additional context for this scheme..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Scheme"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

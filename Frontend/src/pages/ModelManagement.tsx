import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { vehicleModelsAPI } from "@/lib/api";
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

interface Make {
  id: number;
  name: string;
}

interface Model {
  id: number;
  make_id: number;
  name: string;
  make_name: string;
}

export default function ModelManagement() {
  const [models, setModels] = useState<Model[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedMake, setSelectedMake] = useState<Partial<Make> | null>(null);
  const [selectedModel, setSelectedModel] = useState<Partial<Model> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [modelsData, makesData] = await Promise.all([
        vehicleModelsAPI.getAll(),
        vehicleModelsAPI.getMakes(),
      ]);
      setModels(modelsData);
      setMakes(makesData);
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      toast.error("Failed to load vehicle data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddMake = () => {
    setSelectedMake({ name: "" });
    setIsMakeModalOpen(true);
  };

  const handleOpenAddModel = () => {
    setSelectedModel({ name: "", make_id: makes[0]?.id });
    setIsModelModalOpen(true);
  };

  const handleOpenEditModel = (model: Model) => {
    setSelectedModel(model);
    setIsModelModalOpen(true);
  };

  const handleSaveMake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake?.name) return toast.error("Manufacturer name is required");

    setIsSaving(true);
    try {
      await vehicleModelsAPI.createMake(selectedMake);
      toast.success("Manufacturer added successfully");
      setIsMakeModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save manufacturer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel?.name || !selectedModel?.make_id) {
      toast.error("Both manufacturer and model name are required");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedModel.id) {
        await vehicleModelsAPI.update(selectedModel.id, selectedModel);
        toast.success("Model updated successfully");
      } else {
        await vehicleModelsAPI.create(selectedModel);
        toast.success("Model created successfully");
      }
      setIsModelModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save model");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModel = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this model?")) return;
    try {
      await vehicleModelsAPI.delete(id);
      setModels(prev => prev.filter(m => m.id !== id));
      toast.success("Model deleted");
    } catch {
      toast.error("Failed to delete model");
    }
  };

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.make_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Management</h1>
          <p className="text-muted-foreground text-sm">Manage vehicle manufacturers and their specific models.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleOpenAddMake}>
            <Plus size={18} />
            Add Make
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 font-semibold" onClick={handleOpenAddModel}>
            <Plus size={18} />
            Add Model
          </Button>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search models or makes..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Manufacturer (Make)</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Model Name</th>
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
                ) : filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic">
                      No vehicles found.
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((model) => (
                    <tr key={model.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">{model.make_name}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{model.name}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => handleOpenEditModel(model)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                            onClick={() => handleDeleteModel(model.id)}
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

      {/* Add/Edit Make Modal */}
      <Dialog open={isMakeModalOpen} onOpenChange={setIsMakeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveMake}>
            <DialogHeader>
              <DialogTitle>Add New Manufacturer</DialogTitle>
              <DialogDescription>
                Add a new vehicle make (e.g. Maruti Suzuki, Tata, Hyundai).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="make_name">Manufacturer Name</Label>
                <Input
                  id="make_name"
                  value={selectedMake?.name || ""}
                  onChange={(e) => setSelectedMake(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Maruti Suzuki"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMakeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Manufacturer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Model Modal */}
      <Dialog open={isModelModalOpen} onOpenChange={setIsModelModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveModel}>
            <DialogHeader>
              <DialogTitle>{selectedModel?.id ? "Edit Model" : "Add New Model"}</DialogTitle>
              <DialogDescription>
                Assign a model name to a manufacturer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="parent_make">Manufacturer</Label>
                <Select
                  value={selectedModel?.make_id?.toString()}
                  onValueChange={(val) => setSelectedModel(prev => ({ ...prev, make_id: parseInt(val) }))}
                >
                  <SelectTrigger id="parent_make">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes.map(make => (
                      <SelectItem key={make.id} value={make.id.toString()}>{make.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model_name">Model Name</Label>
                <Input
                  id="model_name"
                  value={selectedModel?.name || ""}
                  onChange={(e) => setSelectedModel(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Wagon R, Punch, Creta"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModelModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Model"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

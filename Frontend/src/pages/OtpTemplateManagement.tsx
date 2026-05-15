
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ShieldCheck, 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  Download, 
  MessageSquare, 
  Search,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SmsTemplate {
  id: string;
  key: string;
  pattern: string;
  category: string;
  status: string;
  updated_at: string;
}

const OtpTemplateManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    key: '',
    pattern: '',
    category: 'general',
    status: 'active'
  });

  const { data: templates = [], isLoading } = useQuery<SmsTemplate[]>({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const res = await axios.get('/api/sms-templates');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => axios.post('/api/sms-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template created successfully');
      setIsDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => axios.put(`/api/sms-templates/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template updated successfully');
      setIsDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/sms-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template deleted successfully');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template: SmsTemplate) => {
    setEditingTemplate(template);
    setFormData({
      id: template.id,
      key: template.key,
      pattern: template.pattern,
      category: template.category,
      status: template.status
    });
    setIsDialogOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Template pattern copied');
  };

  const handleDownload = (template: SmsTemplate) => {
    const element = document.createElement("a");
    const file = new Blob([
      `OTP Template: ${template.key}\n`,
      `DLT ID: ${template.id}\n`,
      `Category: ${template.category}\n`,
      `-------------------------------------------\n`,
      `Pattern:\n${template.pattern}\n`,
      `-------------------------------------------\n`,
      `Generated on: ${new Date().toLocaleString()}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${template.key}_template.txt`;
    document.body.appendChild(element);
    element.click();
    toast.success('Template downloaded');
  };

  const filteredTemplates = templates.filter(t => 
    t.key.toLowerCase().includes(search.toLowerCase()) || 
    t.pattern.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'auth': return 'bg-blue-100 text-blue-700';
      case 'loan': return 'bg-purple-100 text-purple-700';
      case 'payment': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-blue-600" />
            OTP Template Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage SMS/OTP templates for various workflows
          </p>
        </div>
        {user?.role === 'super_admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTemplate(null);
                setFormData({ id: '', key: '', pattern: '', category: 'general', status: 'active' });
              }} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={18} className="mr-2" />
                Add New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template Key</label>
                    <Input 
                      placeholder="e.g. LOAN_OTP" 
                      value={formData.key}
                      onChange={e => setFormData({...formData, key: e.target.value.toUpperCase()})}
                      disabled={!!editingTemplate}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">DLT ID</label>
                    <Input 
                      placeholder="1707..." 
                      value={formData.id}
                      onChange={e => setFormData({...formData, id: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={val => setFormData({...formData, category: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auth">Authentication</SelectItem>
                        <SelectItem value="loan">Loan Application</SelectItem>
                        <SelectItem value="payment">Payment Flow</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select 
                      value={formData.status} 
                      onValueChange={val => setFormData({...formData, status: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Pattern</label>
                    <span className="text-[10px] text-gray-500 font-mono">Use {'{#var#}'} for variables</span>
                  </div>
                  <Textarea 
                    rows={4}
                    placeholder="Enter DLT approved pattern..."
                    value={formData.pattern}
                    onChange={e => setFormData({...formData, pattern: e.target.value})}
                    required
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          className="pl-10 h-12 text-lg shadow-sm" 
          placeholder="Search templates by key or content..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">{template.key}</CardTitle>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                      {template.status === 'active' ? (
                        <CheckCircle2 className="text-green-500" size={14} />
                      ) : (
                        <AlertCircle className="text-amber-500" size={14} />
                      )}
                    </div>
                    <CardDescription className="font-mono text-xs">ID: {template.id}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(template.pattern)}>
                      <Copy size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(template)}>
                      <Download size={14} />
                    </Button>
                    {user?.role === 'super_admin' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(template)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => {
                          if (window.confirm('Are you sure you want to delete this template?')) {
                            deleteMutation.mutate(template.id);
                          }
                        }}>
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800 relative">
                  <MessageSquare className="absolute -top-2 -right-2 text-slate-200 dark:text-slate-800" size={32} />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {template.pattern}
                  </p>
                </div>
                <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText size={10} />
                    DLT Compliant
                  </span>
                  <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-slate-500">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
};

export default OtpTemplateManagement;

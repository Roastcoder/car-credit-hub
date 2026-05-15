
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, MessageSquare, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SMSTemplate {
  id: string;
  key: string;
  pattern: string;
  category: string;
  status: string;
}

const SMSTemplates = () => {
  const { data: templates = [], isLoading } = useQuery<SMSTemplate[]>({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const res = await api.get('/sms-templates');
      return res.data || res;
    }
  });

  const handleDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Key,Category,Pattern"].concat(
          templates.map(t => `"${t.id}","${t.key}","${t.category}","${t.pattern.replace(/"/g, '""')}"`)
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sms_templates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Templates downloaded successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS Templates</h1>
          <p className="text-muted-foreground">View and download official SMS/OTP templates</p>
        </div>
        <Button onClick={handleDownload} className="gap-2">
          <Download size={16} />
          Download CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    <MessageSquare size={16} />
                  </div>
                  <CardTitle className="text-sm font-bold truncate">{template.key}</CardTitle>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  template.category === 'otp' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {template.category}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 italic text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                "{template.pattern}"
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Info size={12} />
                <span>Template ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{template.id}</span></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-muted-foreground">No templates found</p>
        </div>
      )}
    </div>
  );
};

export default SMSTemplates;

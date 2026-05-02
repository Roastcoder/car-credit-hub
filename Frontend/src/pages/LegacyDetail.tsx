import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { legacyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Database, History, Share2, Printer } from 'lucide-react';

export default function LegacyDetail() {
  const { table, id } = useParams();
  const navigate = useNavigate();

  const { data: tableData, isLoading } = useQuery({
    queryKey: ['legacy-detail', table, id],
    queryFn: () => legacyAPI.getTableData(table as string),
  });

  // Since we don't have a direct "get by ID" for all tables yet, we find it in the list
  const selectedItem = tableData?.data?.find((item: any) => 
    String(item.iLoanId || item.iCustomerId || item.id || item.iAssociatesId) === id
  );

  const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/legacy-archive')}
          className="hover:bg-amber-50 text-amber-600 font-bold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Archive
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
              <Database className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-amber-600 border-amber-200">#{id}</Badge>
                <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none">
                  {table?.toUpperCase()} ARCHIVE
                </Badge>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedItem?.customer_name || selectedItem?.vCustomerName || 'Record Details'}
              </h1>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {selectedItem ? Object.entries(selectedItem).map(([key, value]: [string, any]) => {
              if (value === null || value === 'NULL' || value === '') return null;
              if (typeof value === 'object') return null;

              return (
                <div key={key} className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 group">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] group-hover:text-amber-600 transition-colors">
                    {formatKey(key)}
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 break-words">
                    {String(value)}
                  </p>
                </div>
              );
            }) : (
              <div className="col-span-full py-20 text-center text-slate-400">
                <History className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="text-xl font-bold">Record Not Found</p>
                <p>The requested record could not be found in the {table} archive.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

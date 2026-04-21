import React, { useState } from 'react';
import { FileText, Eye, Upload, Trash2, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentPreviewCardProps {
  doc: any;
  onView?: (doc: any) => void;
  onDelete?: (doc: any) => void;
  onReupload?: (e: React.ChangeEvent<HTMLInputElement>, id: string, type: string) => void;
  canDelete?: boolean;
  isUploading?: boolean;
  showDelete?: boolean;
  selected?: boolean;
  isAdmin?: boolean;
}

const DocumentPreviewCard: React.FC<DocumentPreviewCardProps> = ({
  doc,
  onView,
  onDelete,
  onReupload,
  canDelete = false,
  isUploading = false,
  showDelete = true,
  selected = false,
  isAdmin = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // URL Normalization Logic (Consolidated from both pages)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace(/\/api$/, '');

  let fileUrl = '';
  if (doc.url) {
    fileUrl = doc.url;
  } else if (doc.file_url) {
    const normalizedPath = doc.file_url.startsWith('/uploads') ? `/api${doc.file_url}` : doc.file_url;
    fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `${baseUrl}${normalizedPath}`;
  }

  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
  const docName = doc.document_name || doc.file_name || doc.name || 'Document';
  const docType = (doc.document_type || doc.type || 'DOCUMENT').replace(/_/g, ' ');

  const toggleExpand = () => {
    if (isImage) {
      setIsExpanded(!isExpanded);
    } else {
      // If it's a PDF, we still provide an "External View" option
      if (onView) onView(doc);
      else window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className={cn(
      "group relative bg-card border border-border rounded-xl p-3 transition-all hover:shadow-md cursor-pointer",
      isExpanded ? "col-span-full border-accent/40 bg-accent/5" : "hover:border-accent/40",
      selected && "border-accent bg-accent/5 ring-1 ring-accent"
    )}>
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h4 className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest truncate">
              {docType}
            </h4>
            <span className="text-[10px] text-muted-foreground truncate opacity-60">
              {docName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selected && (
              <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[8px] font-bold border border-green-500/20">
              SAVED
            </span>
          </div>
        </div>

        {/* Preview Area / Thumbnail */}
        <div
          onClick={toggleExpand}
          className={cn(
            "relative cursor-pointer rounded-lg overflow-hidden bg-muted/30 border border-dashed border-border group-hover:border-accent/20 transition-all flex items-center justify-center",
            isExpanded ? "aspect-auto max-h-[80vh]" : "aspect-video"
          )}
        >
          {isImage ? (
            <img
              src={fileUrl}
              alt={docName}
              className={cn(
                "object-contain transition-all",
                isExpanded ? "w-full h-auto p-2" : "w-full h-full object-cover"
              )}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <FileText size={32} className="text-accent/60" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">PDF Document</span>
            </div>
          )}

          {/* Action Overlay (Visible on Hover when not expanded) */}
          {!isExpanded && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <div className="p-2 bg-white text-black rounded-full shadow-xl">
                {isImage ? (isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />) : <ExternalLink size={16} />}
              </div>
            </div>
          )}
        </div>

        {/* Inline Actions & Metadata */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleExpand}
              className="flex items-center gap-1 text-[10px] font-bold text-accent hover:underline uppercase tracking-tight"
            >
              {isImage ? (isExpanded ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Preview Inline</>) : <><ExternalLink size={12} /> Open Full</>}
            </button>
            <span className="text-[8px] text-muted-foreground uppercase font-medium opacity-50">
              {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {canDelete && onReupload && (
              <label className="p-1.5 bg-muted text-foreground rounded-lg cursor-pointer hover:bg-accent hover:text-white transition-all">
                {isUploading ? <Clock size={12} className="animate-spin" /> : <Upload size={12} />}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => onReupload(e, doc.id, doc.document_type || doc.type)}
                  accept="image/*,.pdf"
                />
              </label>
            )}
            {canDelete && showDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc);
                }}
                className="p-1.5 bg-muted text-foreground rounded-lg hover:bg-red-600 hover:text-white transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewCard;

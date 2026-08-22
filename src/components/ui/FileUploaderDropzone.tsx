import React, { useCallback } from "react";
import { Upload, X, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { formatBytes } from "@/lib/api";

interface FileUploaderDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  acceptedTypes?: string;
  maxFiles?: number;
}

export const FileUploaderDropzone: React.FC<FileUploaderDropzoneProps> = ({
  files,
  onFilesChange,
  title = "DROP FILES HERE or CLICK TO UPLOAD",
  subtitle = "Drag & drop files to scan, analyze, or securely wipe",
  acceptedTypes,
  maxFiles = 20
}) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFiles = Array.from(e.dataTransfer.files);
      const combined = [...files, ...droppedFiles].slice(0, maxFiles);
      onFilesChange(combined);
    },
    [files, onFilesChange, maxFiles]
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const combined = [...files, ...selected].slice(0, maxFiles);
      onFilesChange(combined);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, idx) => idx !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          if (acceptedTypes) input.accept = acceptedTypes;
          input.onchange = (e: any) => handleSelect(e);
          input.click();
        }}
        className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-void/50 hover:bg-primary/5 rounded-xl p-8 text-center transition-all cursor-pointer group"
      >
        <Upload className="w-8 h-8 text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all mx-auto mb-3" />
        <p className="font-mono text-sm text-text-primary font-bold tracking-wide">{title}</p>
        <p className="font-mono text-xs text-text-ghost mt-1">{subtitle}</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-text-ghost">
            <span>Uploaded Files ({files.length})</span>
            <button
              onClick={() => onFilesChange([])}
              className="text-destructive hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-text-primary truncate">{file.name}</p>
                    <p className="text-[10px] font-mono text-text-ghost">
                      {formatFileSize(file.size)} • {file.type || "binary"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="p-1 rounded text-text-ghost hover:text-destructive hover:bg-destructive/10 transition-colors ml-2 shrink-0"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import { useCallback, useRef, useState } from "react";
import { UploadIcon, FileTextIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AtsUploadProps {
  onSubmit: (file: File) => void;
  disabled: boolean;
}

export function AtsUpload({ onSubmit, disabled }: AtsUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      return;
    }
    setFile(selected);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleSubmit = () => {
    if (!file || disabled) return;
    onSubmit(file);
  };

  const clearFile = () => setFile(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">ATS Resume Scanner</h2>
        <p className="text-muted-foreground mt-1">
          Upload your resume to check how well it performs against Applicant Tracking Systems.
        </p>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          data-dragging={isDragging}
          className="relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50 data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5"
        >
          <div className="rounded-full bg-muted p-4">
            <UploadIcon className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">
              Drag & drop your resume here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse — PDF only, up to 10MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileTextIcon className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            disabled={disabled}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!file || disabled}
        onClick={handleSubmit}
      >
        Evaluate Resume
      </Button>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadDocument } from "@/lib/query/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DocumentUpload() {
  const upload = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) upload.mutate({ file });
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragOver ? "border-primary bg-accent" : "border-border hover:bg-muted/50"
        )}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Drop a bill or contract here, or click to upload</p>
        <p className="text-xs text-muted-foreground">PDF, PNG, JPG or WebP · up to 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {upload.isPending ? <p className="mt-2 text-sm text-muted-foreground">Uploading…</p> : null}
      {upload.isError ? (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>
            {upload.error instanceof Error ? upload.error.message : "Upload failed."}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

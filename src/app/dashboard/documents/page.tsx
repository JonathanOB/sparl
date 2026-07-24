"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/lib/query/hooks";
import type { Enums } from "@/shared/types/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { DocumentUpload } from "@/components/documents/document-upload";

const statusLabel: Record<Enums<"document_processing_status">, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const statusStyle: Record<Enums<"document_processing_status">, string> = {
  uploaded: "bg-muted text-muted-foreground",
  processing: "bg-warning-subtle text-warning",
  completed: "bg-success-subtle text-success",
  failed: "bg-destructive/10 text-destructive",
};

const titleFor = (docType: Enums<"document_type"> | null) =>
  docType ? docType.replace(/_/g, " ") : "Document";

export default function DocumentsPage() {
  const { data: documents, isLoading, isError, refetch } = useDocuments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Upload bills and contracts — Sparl reads them and tracks your renewals.
        </p>
      </div>

      <DocumentUpload />

      {isLoading ? (
        <LoadingState message="Loading your documents…" />
      ) : isError ? (
        <ErrorState
          message="We couldn't load your documents."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !documents || documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium capitalize">{titleFor(d.document_type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    statusStyle[d.processing_status]
                  )}
                >
                  {statusLabel[d.processing_status]}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

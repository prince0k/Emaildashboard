"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, EyeOff } from "lucide-react";

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creativeId = searchParams.get("id");

  if (!creativeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <EyeOff className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h2 className="text-lg font-semibold text-fg">No Creative Selected</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please select a creative to preview.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-fg hover:bg-muted/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">Creative Preview</h1>
          <p className="text-sm text-muted-foreground">
            Preview how your creative will appear
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <iframe
          src={`/api/offers/creatives/preview?id=${creativeId}`}
          className="w-full h-[90vh]"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
}
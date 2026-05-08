"use client";

import FromLineManager from "@/components/FromLineManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function FromLinesPage({ params }) {
  const { offerId } = params;

  if (!offerId) {
    return <div className="p-6 text-sm text-red-400">Invalid offer ID</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      <Link
        href={`/offers/${params.offerId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-fg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offer Workspace
      </Link>
      <h1 className="text-lg font-semibold">From Lines</h1>
      <p className="text-sm text-gray-400">
        Sender display names for this offer
      </p>

      <FromLineManager offerId={offerId} />
    </div>
  );
}
"use client";

import SubjectLineManager from "@/components/SubjectLineManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function SubjectLinesPage({ params }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <Link
        href={`/offers/${params.offerId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-fg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offer Workspace
      </Link>
      <div>
        <h1 className="text-lg font-semibold">Subject Lines</h1>
        <p className="text-sm text-gray-400">
          Subject lines linked to this offer
        </p>
      </div>

      <SubjectLineManager offerId={params.offerId} />
    </div>
  );
}
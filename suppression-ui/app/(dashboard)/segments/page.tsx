import Link from "next/link";
import SegmentTable from "@/components/segments/SegmentTable";

export default function SegmentsPage() {

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Segments
          </h1>

          <p className="text-sm text-text-muted">
            Build and manage audience segments
          </p>
        </div>

        <Link
          href="/segments/create"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors text-sm"
        >
          Create Segment
        </Link>

      </div>

      {/* SEGMENT TABLE */}

      <SegmentTable />

    </div>

  );

}
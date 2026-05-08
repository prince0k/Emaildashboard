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

          <p className="text-sm text-muted-foreground">
            Build and manage audience segments
          </p>
        </div>

        <Link
          href="/segments/create"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Segment
        </Link>

      </div>

      {/* SEGMENT TABLE */}

      <SegmentTable />

    </div>

  );

}
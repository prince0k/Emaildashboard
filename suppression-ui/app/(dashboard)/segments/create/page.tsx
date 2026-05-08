import Link from "next/link";
import SegmentBuilder from "@/components/segments/SegmentBuilder";

export default function CreateSegmentPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">

        <div>
          <h1 className="text-2xl font-semibold">
            Create Segment
          </h1>

          <p className="text-sm text-muted-foreground">
            Build a custom audience segment from tracking data
          </p>
        </div>

        <Link
          href="/segments"
          className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition"
        >
          Back to Segments
        </Link>

      </div>

      {/* BUILDER */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <SegmentBuilder />
      </div>

    </div>
  );
}
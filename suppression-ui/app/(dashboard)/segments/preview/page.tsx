import { Suspense } from "react";
import SegmentPreviewClient from "./SegmentPreviewClient";

export default function SegmentPreviewPage() {
  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <SegmentPreviewClient />
    </Suspense>
  );
}
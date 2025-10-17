export const runtime = 'edge';
"use client";
import { Suspense } from "react";
import TrackResultPage from "./client";

export default function TrackResult() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackResultPage />
    </Suspense>
  )

}

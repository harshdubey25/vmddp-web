"use client";

import { Suspense } from "react";
import AccountantTrackResultClient from "./client";

export default function AccountantTrackResultPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AccountantTrackResultClient />
        </Suspense>
    );
}
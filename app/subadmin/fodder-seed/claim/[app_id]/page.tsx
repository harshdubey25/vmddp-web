export const runtime = 'edge';

import { use } from "react";
// Import DynamicWrapper to handle dynamic loading without SSR
import DynamicWrapper from "./dynamic-wrapper";

export default function Page({
    params
}: {
    params: Promise<{ app_id: string }>;
}) {
    const { app_id } = use(params);
    return <DynamicWrapper appId={app_id} />;
}

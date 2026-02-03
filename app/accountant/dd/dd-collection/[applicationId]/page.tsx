export const runtime = 'edge';

import { use } from "react";
import DynamicWrapper from "./dynamic-wrapper";

export default function Page({ params }: { params: Promise<{ applicationId: string }> }) {
    const { applicationId } = use(params);
    return <DynamicWrapper applicationId={applicationId} />;
}

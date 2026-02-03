export const runtime = 'edge';

import { use } from "react";
import DynamicWrapper from "./dynamic-wrapper";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <DynamicWrapper id={id} />;
}

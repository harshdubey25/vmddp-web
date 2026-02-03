export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Report from "./client";

export default async function Page({ params }: { params: Promise<{ district: string; component: string }> }) {
  const { district, component } = (await params);

  return (
    <Report district={district} component={decodeURIComponent(component)} />
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CardSkeletonProps {
    showHeader?: boolean;
    showDescription?: boolean;
    contentLines?: number;
}

export function CardSkeleton({
    showHeader = true,
    showDescription = true,
    contentLines = 3,
}: CardSkeletonProps) {
    return (
        <Card>
            {showHeader && (
                <CardHeader className="space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    {showDescription && <Skeleton className="h-4 w-2/3" />}
                </CardHeader>
            )}
            <CardContent className="space-y-3">
                {Array.from({ length: contentLines }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                ))}
            </CardContent>
        </Card>
    );
}

interface ListSkeletonProps {
    count?: number;
    showAvatar?: boolean;
    showBadge?: boolean;
}

export function ListSkeleton({
    count = 5,
    showAvatar = false,
    showBadge = true,
}: ListSkeletonProps) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                >
                    {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-32" />
                            {showBadge && <Skeleton className="h-5 w-20 rounded-full" />}
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-5 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 p-4 border-b">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

interface StatsSkeletonProps {
    count?: number;
}

export function StatsSkeleton({ count = 4 }: StatsSkeletonProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

interface DashboardSkeletonProps {
    showStats?: boolean;
    showCards?: boolean;
}

export function DashboardSkeleton({
    showStats = true,
    showCards = true,
}: DashboardSkeletonProps) {
    return (
        <div className="space-y-6">
            {showStats && <StatsSkeleton />}
            {showCards && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <CardSkeleton contentLines={5} />
                    </div>
                    <div className="space-y-6">
                        <CardSkeleton contentLines={3} />
                        <CardSkeleton contentLines={3} />
                    </div>
                </div>
            )}
        </div>
    );
}

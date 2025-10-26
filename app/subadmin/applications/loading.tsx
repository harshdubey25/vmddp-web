import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AdminSidebar userRole="subadmin" />

            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header Skeleton */}
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-36" />
                                        <Skeleton className="h-4 w-64" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Search and Filter Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                </div>

                                {/* Table Skeleton */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            {/* Table Header */}
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="text-left p-3">
                                                        <Skeleton className="h-4 w-20" />
                                                    </th>
                                                    <th className="text-left p-3">
                                                        <Skeleton className="h-4 w-24" />
                                                    </th>
                                                    <th className="text-left p-3">
                                                        <Skeleton className="h-4 w-16" />
                                                    </th>
                                                    <th className="text-left p-3">
                                                        <Skeleton className="h-4 w-20" />
                                                    </th>
                                                    <th className="text-left p-3">
                                                        <Skeleton className="h-4 w-16" />
                                                    </th>
                                                    <th className="text-left p-3">
                                                        <Skeleton className="h-4 w-20" />
                                                    </th>
                                                    <th className="text-left p-3">
                                                        <Skeleton className="h-4 w-16" />
                                                    </th>
                                                </tr>
                                            </thead>
                                            {/* Table Body */}
                                            <tbody>
                                                {Array.from({ length: 10 }).map((_, index) => (
                                                    <tr key={index} className="border-b hover:bg-muted/30">
                                                        <td className="p-3">
                                                            <Skeleton className="h-4 w-24" />
                                                        </td>
                                                        <td className="p-3">
                                                            <Skeleton className="h-4 w-32" />
                                                        </td>
                                                        <td className="p-3">
                                                            <Skeleton className="h-4 w-20" />
                                                        </td>
                                                        <td className="p-3">
                                                            <Skeleton className="h-4 w-28" />
                                                        </td>
                                                        <td className="p-3">
                                                            <Skeleton className="h-5 w-16 rounded-full" />
                                                        </td>
                                                        <td className="p-3">
                                                            <Skeleton className="h-4 w-20" />
                                                        </td>
                                                        <td className="p-3">
                                                            <Skeleton className="h-8 w-16" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination Skeleton */}
                                <div className="flex items-center justify-between pt-4">
                                    <Skeleton className="h-4 w-48" />
                                    <div className="flex items-center space-x-2">
                                        <Skeleton className="h-9 w-20" />
                                        <Skeleton className="h-9 w-8" />
                                        <Skeleton className="h-9 w-8" />
                                        <Skeleton className="h-9 w-8" />
                                        <Skeleton className="h-9 w-8" />
                                        <Skeleton className="h-9 w-20" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}

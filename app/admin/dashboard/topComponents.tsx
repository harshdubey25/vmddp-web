"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { frappeBrowser } from "@/lib/frappe";
import Link from "next/link";

interface ComponentData {
    name: string;
    applications: number;
    percentage: number;
}

function TopComponentsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function TopComponents() {
    const [topComponents, setTopComponents] = useState<ComponentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchTopComponents() {
            try {
                const response = await frappeBrowser.call().get('vmddp_app.api.v1.dashboard.components_statistics');
                console.log("Fetched top components:", response);
                setTopComponents(response?.message?.components || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching top components:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        }
        fetchTopComponents();
    }, []);

    if (isLoading) {
        return <TopComponentsSkeleton />;
    }

    if (error) {
        return (
            <Card className="border-destructive/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <CardTitle className="text-destructive">Top Components - Error</CardTitle>
                    </div>
                    <CardDescription>Failed to load component statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <h4 className="font-semibold text-destructive text-sm mb-1">Error Details:</h4>
                        <p className="text-xs font-mono break-all text-destructive/80">
                            {error.message}
                        </p>
                    </div>

                    <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-auto max-h-32">
                        <h5 className="text-white mb-1 text-xs">Full Error Object:</h5>
                        <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                                setIsLoading(true);
                                setError(null);
                                window.location.reload();
                            }}
                        >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle data-testid="text-top-components">Top Components</CardTitle>
                    <CardDescription>Most requested schemes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {topComponents.length > 0 ? (
                        topComponents.map((component, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{component.name}</span>
                                    <span className="text-muted-foreground">{component.applications}</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${component.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-4">
                            No component data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
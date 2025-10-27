import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Package, AlertTriangle, RefreshCw } from "lucide-react";
import { frappeServer } from "@/lib/frappe";
import Link from "next/link";

export default async function TopComponents() {
    try {
        // Fetch component statistics from API
        const response = await frappeServer.call().get('vmddp_app.api.v1.dashboard.components_statistics');
        console.log("Fetched top components:", response);
        const topComponents = response?.message?.components || [];

        return <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle data-testid="text-top-components">Top Components</CardTitle>
                    <CardDescription>Most requested schemes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {topComponents.length > 0 ? (
                        topComponents.map((component: any, index: number) => (
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
    } catch (error) {
        console.error('Error fetching top components:', error);
        
        // Return error display component
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
                            {error instanceof Error ? error.message : String(error)}
                        </p>
                    </div>

                    <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-auto max-h-32">
                        <h5 className="text-white mb-1 text-xs">Full Error Object:</h5>
                        <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/admin/dashboard">
                            <Button size="sm" variant="outline" className="gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }
}
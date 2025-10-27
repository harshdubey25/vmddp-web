import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Package } from "lucide-react";
import { frappeServer } from "@/lib/frappe";

export default async function TopComponents() {
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
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Target,
    IndianRupee,

} from "lucide-react";
import { Progress } from "@/components/ui/progress";
const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
    return `${amount.toLocaleString("en-IN")}`;
};

export default function AccountantDashboard() {

    return (
        <main className=" overflow-auto min-h-screen bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-physical-achievement"  >
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                        <CardTitle className="text-sm font-medium">Physical Achievement</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{10}</div>
                        <Progress value={10} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {20}% of target achieved
                        </p>
                    </CardContent>
                </Card>

                <Card data-testid="card-financial-achievement">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                        <CardTitle className="text-sm font-medium">Financial Achievement</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(100)}
                        </div>
                        <Progress value={10} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {10}% of target achieved
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
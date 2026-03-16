import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type DashboardStatCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color: "yellow" | "green" | "blue" | "purple" | "indigo" | "red" | "gray" | "orange";
    testId?: string;
};

const colorStyles = {
    yellow: {
        border: "border-yellow-500/30",
        bg: "from-yellow-500/10 to-yellow-600/5",
        orb: "from-yellow-500/20 to-yellow-600/10",
        chip: "bg-yellow-500/10 border-yellow-500/20",
        icon: "text-yellow-500",
        title: "text-yellow-700/80 dark:text-yellow-300",
        value: "text-yellow-900 dark:text-yellow-100",
    },
    green: {
        border: "border-green-500/30",
        bg: "from-green-500/10 to-green-600/5",
        orb: "from-green-500/20 to-green-600/10",
        chip: "bg-green-500/10 border-green-500/20",
        icon: "text-green-500",
        title: "text-green-700/80 dark:text-green-300",
        value: "text-green-900 dark:text-green-100",
    },
    blue: {
        border: "border-blue-500/30",
        bg: "from-blue-500/10 to-blue-600/5",
        orb: "from-blue-500/20 to-blue-600/10",
        chip: "bg-blue-500/10 border-blue-500/20",
        icon: "text-blue-500",
        title: "text-blue-700/80 dark:text-blue-300",
        value: "text-blue-900 dark:text-blue-100",
    },
    purple: {
        border: "border-purple-500/30",
        bg: "from-purple-500/10 to-purple-600/5",
        orb: "from-purple-500/20 to-purple-600/10",
        chip: "bg-purple-500/10 border-purple-500/20",
        icon: "text-purple-500",
        title: "text-purple-700/80 dark:text-purple-300",
        value: "text-purple-900 dark:text-purple-100",
    },
    indigo: {
        border: "border-indigo-500/30",
        bg: "from-indigo-500/10 to-indigo-600/5",
        orb: "from-indigo-500/20 to-indigo-600/10",
        chip: "bg-indigo-500/10 border-indigo-500/20",
        icon: "text-indigo-500",
        title: "text-indigo-700/80 dark:text-indigo-300",
        value: "text-indigo-900 dark:text-indigo-100",
    },
    red: {
        border: "border-red-500/30",
        bg: "from-red-500/10 to-red-600/5",
        orb: "from-red-500/20 to-red-600/10",
        chip: "bg-red-500/10 border-red-500/20",
        icon: "text-red-500",
        title: "text-red-700/80 dark:text-red-300",
        value: "text-red-900 dark:text-red-100",
    },
    gray: {
        border: "border-gray-500/30",
        bg: "from-gray-500/10 to-gray-600/5",
        orb: "from-gray-500/20 to-gray-600/10",
        chip: "bg-gray-500/10 border-gray-500/20",
        icon: "text-gray-500",
        title: "text-gray-700/80 dark:text-gray-300",
        value: "text-gray-900 dark:text-gray-100",
    },
    orange: {
        border: "border-orange-500/30",
        bg: "from-orange-500/10 to-orange-600/5",
        orb: "from-orange-500/20 to-orange-600/10",
        chip: "bg-orange-500/10 border-orange-500/20",
        icon: "text-orange-500",
        title: "text-orange-700/80 dark:text-orange-300",
        value: "text-orange-900 dark:text-orange-100",
    },
};

export function DashboardStatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    testId,
}: DashboardStatCardProps) {
    const styles = colorStyles[color];

    return (
        <Card
            data-testid={testId}
            className={`relative overflow-hidden border-2 ${styles.border} bg-gradient-to-br ${styles.bg} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm`}
        >
            <div
                className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${styles.orb} opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110`}
            />

            <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg border ${styles.chip}`}>
                        <Icon className={`h-5 w-5 ${styles.icon}`} />
                    </div>

                    <div>
                        <p className={`text-sm font-medium ${styles.title}`}>
                            {title}
                        </p>

                        <p className={`text-2xl font-bold drop-shadow-sm ${styles.value}`}>
                            {value}
                        </p>

                        {subtitle && (
                            <p className="text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
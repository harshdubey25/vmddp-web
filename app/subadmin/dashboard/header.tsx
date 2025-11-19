"use client"
import { useAuth } from "@/context/AuthContext"
import { MapPin } from "lucide-react"

export const Header = () => {

    const { user } = useAuth()
    console.log(user)
    return (
        <header className="flex h-16 items-center justify-between border-b pl-12 pr-3 md:px-6 bg-background">
            <div className="min-w-0 flex-1 mr-2">
                <h1 className="font-display font-semibold text-base sm:text-lg md:text-xl truncate" data-testid="text-dashboard-title">
                    Dashboard Overview
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Welcome back, {user?.full_name}</p>

            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted rounded-lg">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <div className="text-xs sm:text-sm">
                        <span className="font-medium truncate">{user?.dpo?.district}</span>
                        {/* <span className="text-muted-foreground"> • {'assignedZone.taluka'}</span> */}
                    </div>
                </div>
            </div>
        </header>
    )
}
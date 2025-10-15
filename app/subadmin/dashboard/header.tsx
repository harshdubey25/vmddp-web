"use client"
import { useAuth } from "@/context/AuthContext"
import { MapPin } from "lucide-react"

export const Header = () => {

    const { user } = useAuth()
    console.log(user)
    return (
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
            <div>
                <h1 className="font-display font-semibold text-xl" data-testid="text-dashboard-title">
                    Dashboard Overview
                </h1>
                <p className="text-sm text-muted-foreground">Welcome back,{user?.full_name}</p>

            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div className="text-sm">
                        <span className="font-medium">{user?.dpo?.district}</span>
                        {/* <span className="text-muted-foreground"> • {'assignedZone.taluka'}</span> */}
                    </div>
                </div>
            </div>
        </header>
    )
}
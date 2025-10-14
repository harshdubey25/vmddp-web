"use client"
import { useAuth } from "@/context/AuthContext";
export const DashboardClient = () => {
    const { user } = useAuth();
    return (
        <div>
            <h2>Dashboard Client</h2>
            <p>User Role: {JSON.stringify(user)}</p>
        </div>
    );
}
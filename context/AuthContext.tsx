"use client"
import { UserRole } from "@/enums/roles";
import { createContext, ReactNode, useState, useEffect } from "react";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface User {
    user: string; // frappe user_id (email or "Administrator")
    user_type: "System User" | "Website User";
    roles: string[];
    full_name: string;
    dpo: any;
}

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, captchaInput: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => void;
    adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("frappe_access_token");
        if (!token) {
            setLoading(false);
            return;
        }

        fetch("/api/auth/validate", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.user) {
                    setUser(data as User);
                } else {
                    localStorage.removeItem("frappe_access_token");
                    setUser(null);
                }
                setLoading(false);
            })
            .catch(() => {
                setUser(null);
                setLoading(false);
            });
    }, []);

    // 🛡️ Added captchaInput to function arguments
    const login = async (email: string, password: string, captchaInput: string): Promise<{ ok: boolean; error?: string }> => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, captchaInput }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { ok: false, error: data.error || "Authentication failed." };
            }

            localStorage.setItem("frappe_access_token", data.access_token);
            if (data.refresh_token) {
                localStorage.setItem("frappe_refresh_token", data.refresh_token);
            }
            let validated;
            
            // Immediately validate
            const validateRes = await fetch("/api/auth/validate");

            if (validateRes.ok) {
                validated = await validateRes.json();
                if (validated?.user) {
                    setUser(validated as User);
                }
            } else {
                const validateErr = await validateRes.json();
                return { ok: false, error: validateErr.error || "Session validation failed." };
            }
            if (validated?.roles.includes(UserRole.VMDDP_ADMIN)) {
                router.push('/admin/dashboard');
            } else if (validated?.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
                router.push('/subadmin/dashboard');
            } else if (validated?.roles.includes(UserRole.VMDDP_ACCOUNTANT)) {
                router.push('/accountant/dd');
            } else if (validated?.roles.includes(UserRole.VMDDP_SECRETORY)) {
                router.push('/secretory/dashboard');
            } else {
                router.push('/');
            }

            return { ok: true };
        } catch (err) {
            console.error("Login error:", err);
            return { ok: false, error: "An unexpected client error occurred." };
        }
    };

    const logout = async () => {
        localStorage.removeItem("frappe_access_token");
        localStorage.removeItem("frappe_refresh_token");
        // Remove cookies by setting expiry to past date
        await fetch("/api/auth/logout");
        setUser(null);
        router.push("/login");
    };

    const adminLogout = async () => {
        await logout();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, adminLogout }} >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
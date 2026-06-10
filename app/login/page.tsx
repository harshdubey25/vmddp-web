"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Lock, Shield, User, RefreshCw, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";

export default function Login() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [captchaCode, setCaptchaCode] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        rememberMe: false,
    });

    const fetchNewCaptcha = async () => {
        try {
            const res = await fetch("/api/auth/captcha");
            if (res.ok) {
                const data = await res.json();
                setCaptchaCode(data.captchaCode);
                setCaptchaInput("");
            }
        } catch (err) {
            console.error("Failed to fetch security captcha", err);
        }
    };

    useEffect(() => {
        fetchNewCaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (captchaInput.trim().length !== 6) {
            toast({
                title: "Invalid CAPTCHA",
                description: "Please enter the complete 6-digit verification code.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(formData.password);
            const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const secureHashedPassword = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

            // Directly fetch payload challenge matching our updated route validation requirements
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.username,
                    password: secureHashedPassword,
                    captchaInput: captchaInput
                })
            });

            const result = await response.json();

            if (!response.ok || !result.ok || !result.sessionNonce) {
                toast({
                    title: "Authentication Failed",
                    description: result.error || "The credentials provided are incorrect or your session state is invalid.",
                    variant: "destructive",
                });
                fetchNewCaptcha();
                return;
            }

            const success = await login(formData.username, secureHashedPassword, captchaInput);

            if (success) {
                toast({
                    title: "Access Approved",
                    description: "Welcome back to the administrative portal control panel.",
                    variant: "default",
                });
            }

        } catch (err) {
            console.error("Authentication Runtime Verification Error:", err);
            toast({
                title: "Security State Failure",
                description: "An unhandled exception occurred verifying execution data hashes.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-primary/5 -z-10" />
            <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-3xl -z-10 animate-pulse duration-[8000ms]" />
            <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-3xl -z-10 animate-pulse duration-[8000ms]" />

            <div className="w-full max-w-[440px] z-10 animate-fade-in">
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center mb-3 border border-primary/10">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="font-display font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
                        VMDDP PORTAL
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                        Vidarbha Marathwada Dairy Development Project
                    </p>
                </div>

                <Card className="border shadow-2xl backdrop-blur-sm bg-background/95">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold tracking-tight">Sign In</CardTitle>
                        <CardDescription>Enter your official credentials to access the console</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username / Email ID</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        placeholder="name@example.com"
                                        type="text"
                                        className="pl-9 bg-muted/20 focus:bg-background transition-colors"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        className="pl-9 bg-muted/20 focus:bg-background transition-colors"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-3 mt-4">
                                <Label htmlFor="captcha">Security Verification</Label>
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1 bg-zinc-900 border text-zinc-100 font-mono font-bold tracking-[0.4em] text-lg rounded-md h-10 flex items-center justify-center select-none shadow-inner bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-900 relative overflow-hidden min-w-[140px]">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:10px_10px]" />
                                        <span className="relative z-10 animate-pulse skew-x-6">
                                            {captchaCode || "••••••"}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 shrink-0"
                                        onClick={fetchNewCaptcha}
                                        disabled={isLoading}
                                        title="Refresh Verification Code"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                    </Button>
                                </div>
                                <Input
                                    id="captcha"
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="text-center font-mono uppercase tracking-widest mt-2 bg-muted/20 focus:bg-background"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full mt-2"
                                disabled={
                                    isLoading ||
                                    formData.username.trim() === "" ||
                                    formData.password.trim() === "" ||
                                    captchaInput.trim().length !== 6
                                }
                                data-testid="button-login"
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Lock className="w-4 h-4" />
                                <span>Secure Login - Government Portal</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        A joint initiative of Government of Maharashtra & NDDB
                    </p>
                </div>
            </div>
        </div>
    );
}
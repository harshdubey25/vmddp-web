"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Lock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
export default function Login() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role: "",
        rememberMe: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate login process
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Navigate to appropriate dashboard based on role
        if (formData.role === "admin") {
            router.push("/admin/dashboard");
        } else if (formData.role === "subadmin") {
            router.push("/subadmin/dashboard");
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link href="/">
                    <Button className="mb-4" data-testid="button-back-home">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </Link>

                <Card className="shadow-lg" data-testid="card-login">
                    <CardHeader className="space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <div className="text-center">
                            <CardTitle className="font-display text-2xl" data-testid="text-login-title">
                                Admin Portal Login
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Vidarbha Marathwada Dairy Development Programme
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Login As</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                                    required
                                >
                                    <SelectTrigger id="role" data-testid="select-role">
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin" data-testid="option-admin">
                                            Administrator
                                        </SelectItem>
                                        <SelectItem value="subadmin" data-testid="option-subadmin">
                                            Sub-Administrator (DPO)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Enter your username"
                                        className="pl-10"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        data-testid="input-username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        className="pl-10"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        data-testid="input-password"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={formData.rememberMe}
                                        onCheckedChange={(checked: any) =>
                                            setFormData({ ...formData, rememberMe: checked as boolean })
                                        }
                                        data-testid="checkbox-remember"
                                    />
                                    <label
                                        htmlFor="remember"
                                        className="text-sm text-muted-foreground cursor-pointer"
                                    >
                                        Remember me
                                    </label>
                                </div>
                                <Button
                                    type="button"
                                    className="px-0 text-sm h-auto"
                                    data-testid="button-forgot-password"
                                >
                                    Forgot password?
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !formData.role}
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

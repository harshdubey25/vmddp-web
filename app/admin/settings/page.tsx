"use client"
// ...existing code...
// Content from src/pages/admin/Settings.tsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from "@/components/AdminSidebar";
import {
    Settings as SettingsIcon,
    Building2,
    Bell,
    Save,
    Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
    const { toast } = useToast();
    const [portalSettings, setPortalSettings] = useState({
        portalName: "VMDDP Registration Portal",
        contactEmail: "support@vmddp.gov.in",
        contactPhone: "1800-123-4567",
        address: "Vidarbha Marathwada Development Corporation, Nagpur, Maharashtra",
        applicationDeadline: "2025-03-31",
        workingHours: "Monday to Friday, 10:00 AM - 5:00 PM",
    });

    const [smsSettings, setSmsSettings] = useState({
        enabled: true,
        onSubmission: true,
        onApproval: true,
        onRejection: true,
        submissionTemplate: "Your application {APP_ID} has been submitted successfully. Track status at vmddp.gov.in",
        approvalTemplate: "Congratulations! Your application {APP_ID} for {COMPONENT} has been approved.",
        rejectionTemplate: "Your application {APP_ID} has been rejected. Reason: {REASON}. Contact support for details.",
    });

    const handleSavePortalSettings = () => {
        toast({
            title: "Settings Saved",
            description: "Portal settings have been updated successfully.",
        });
    };

    const handleSaveSMSSettings = () => {
        toast({
            title: "Notifications Saved",
            description: "SMS notification settings have been updated successfully.",
        });
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AdminSidebar userRole="admin" />
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6" />
                            Settings
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure portal settings and preferences
                        </p>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="max-w-5xl space-y-6">
                        <Tabs defaultValue="system" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-md">
                                <TabsTrigger value="system" data-testid="tab-system">
                                    <Building2 className="w-4 h-4 mr-2" />
                                    System Configuration
                                </TabsTrigger>
                                <TabsTrigger value="notifications" data-testid="tab-notifications">
                                    <Bell className="w-4 h-4 mr-2" />
                                    Notifications
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="system" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Portal Settings</CardTitle>
                                        <CardDescription>
                                            Manage general portal configuration and contact information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="portalName">Portal Name</Label>
                                                <Input
                                                    id="portalName"
                                                    value={portalSettings.portalName}
                                                    onChange={(e) =>
                                                        setPortalSettings({ ...portalSettings, portalName: e.target.value })
                                                    }
                                                    data-testid="input-portal-name"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="contactEmail">Contact Email</Label>
                                                    <Input
                                                        id="contactEmail"
                                                        type="email"
                                                        value={portalSettings.contactEmail}
                                                        onChange={(e) =>
                                                            setPortalSettings({ ...portalSettings, contactEmail: e.target.value })
                                                        }
                                                        data-testid="input-contact-email"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="contactPhone">Contact Phone</Label>
                                                    <Input
                                                        id="contactPhone"
                                                        value={portalSettings.contactPhone}
                                                        onChange={(e) =>
                                                            setPortalSettings({ ...portalSettings, contactPhone: e.target.value })
                                                        }
                                                        data-testid="input-contact-phone"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="address">Office Address</Label>
                                                <Textarea
                                                    id="address"
                                                    value={portalSettings.address}
                                                    onChange={(e) =>
                                                        setPortalSettings({ ...portalSettings, address: e.target.value })
                                                    }
                                                    rows={3}
                                                    data-testid="textarea-address"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="logo">Portal Logo</Label>
                                                <div className="flex items-center gap-4">
                                                    <Button variant="outline" size="sm" data-testid="button-upload-logo">
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload Logo
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground">
                                                        Recommended: 200x80px, PNG or SVG
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t">
                                            <h3 className="font-semibold mb-4">Application Schedule</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="deadline">Application Deadline</Label>
                                                    <Input
                                                        id="deadline"
                                                        type="date"
                                                        value={portalSettings.applicationDeadline}
                                                        onChange={(e) =>
                                                            setPortalSettings({
                                                                ...portalSettings,
                                                                applicationDeadline: e.target.value,
                                                            })
                                                        }
                                                        data-testid="input-deadline"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="workingHours">Working Hours</Label>
                                                    <Input
                                                        id="workingHours"
                                                        value={portalSettings.workingHours}
                                                        onChange={(e) =>
                                                            setPortalSettings({ ...portalSettings, workingHours: e.target.value })
                                                        }
                                                        data-testid="input-working-hours"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button onClick={handleSavePortalSettings} data-testid="button-save-portal">
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="notifications" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>SMS Notification Settings</CardTitle>
                                        <CardDescription>
                                            Configure SMS notifications for application updates
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Enable SMS Notifications</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Send automated SMS updates to applicants
                                                </p>
                                            </div>
                                            <Switch
                                                checked={smsSettings.enabled}
                                                onCheckedChange={(checked) =>
                                                    setSmsSettings({ ...smsSettings, enabled: checked })
                                                }
                                                data-testid="switch-sms-enabled"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Notification Triggers</h3>

                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="onSubmission">Application Submitted</Label>
                                                <Switch
                                                    id="onSubmission"
                                                    checked={smsSettings.onSubmission}
                                                    onCheckedChange={(checked) =>
                                                        setSmsSettings({ ...smsSettings, onSubmission: checked })
                                                    }
                                                    disabled={!smsSettings.enabled}
                                                    data-testid="switch-submission"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="onApproval">Application Approved</Label>
                                                <Switch
                                                    id="onApproval"
                                                    checked={smsSettings.onApproval}
                                                    onCheckedChange={(checked) =>
                                                        setSmsSettings({ ...smsSettings, onApproval: checked })
                                                    }
                                                    disabled={!smsSettings.enabled}
                                                    data-testid="switch-approval"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="onRejection">Application Rejected</Label>
                                                <Switch
                                                    id="onRejection"
                                                    checked={smsSettings.onRejection}
                                                    onCheckedChange={(checked) =>
                                                        setSmsSettings({ ...smsSettings, onRejection: checked })
                                                    }
                                                    disabled={!smsSettings.enabled}
                                                    data-testid="switch-rejection"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t space-y-4">
                                            <h3 className="font-semibold">Message Templates</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Use placeholders: {"{APP_ID}"}, {"{COMPONENT}"}, {"{REASON}"}
                                            </p>

                                            <div className="space-y-2">
                                                <Label htmlFor="submissionTemplate">Submission Template</Label>
                                                <Textarea
                                                    id="submissionTemplate"
                                                    value={smsSettings.submissionTemplate}
                                                    onChange={(e) =>
                                                        setSmsSettings({ ...smsSettings, submissionTemplate: e.target.value })
                                                    }
                                                    rows={3}
                                                    disabled={!smsSettings.enabled}
                                                    data-testid="textarea-submission-template"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="approvalTemplate">Approval Template</Label>
                                                <Textarea
                                                    id="approvalTemplate"
                                                    value={smsSettings.approvalTemplate}
                                                    onChange={(e) =>
                                                        setSmsSettings({ ...smsSettings, approvalTemplate: e.target.value })
                                                    }
                                                    rows={3}
                                                    disabled={!smsSettings.enabled}
                                                    data-testid="textarea-approval-template"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="rejectionTemplate">Rejection Template</Label>
                                                <Textarea
                                                    id="rejectionTemplate"
                                                    value={smsSettings.rejectionTemplate}
                                                    onChange={(e) =>
                                                        setSmsSettings({ ...smsSettings, rejectionTemplate: e.target.value })
                                                    }
                                                    rows={3}
                                                    disabled={!smsSettings.enabled}
                                                    data-testid="textarea-rejection-template"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button onClick={handleSaveSMSSettings} data-testid="button-save-sms">
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}

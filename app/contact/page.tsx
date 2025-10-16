"use client"
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Message Sent",
            description: "Thank you for contacting us. We will get back to you soon.",
        });
        console.log("Contact form submitted");
    };

    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-contact-title">
                        Contact District Programme Officer
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Select your district and send a message to your local DPO for assistance with dairy schemes
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card data-testid="card-contact-info">
                            <CardContent className="p-6">
                                <h3 className="font-display font-semibold text-lg mb-4">Programme Office</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Main Office</p>
                                            <p className="text-sm text-muted-foreground">
                                                Animal Husbandry Department<br />
                                                Maharashtra Government<br />
                                                Nagpur, Maharashtra
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Phone</p>
                                            <p className="text-sm text-muted-foreground">1800-XXX-XXXX</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Email</p>
                                            <p className="text-sm text-muted-foreground">vmddp@maharashtra.gov.in</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-display font-semibold text-lg mb-2">Office Hours</h3>
                                <p className="text-sm text-muted-foreground">
                                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                                    Saturday: 9:00 AM - 1:00 PM<br />
                                    Sunday: Closed
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-display font-semibold text-lg mb-6">Send us a Message</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-name">Name *</Label>
                                            <Input id="contact-name" data-testid="input-contact-name" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-email">Email *</Label>
                                            <Input id="contact-email" type="email" data-testid="input-contact-email" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-subject">Subject *</Label>
                                        <Input id="contact-subject" data-testid="input-contact-subject" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-message">Message *</Label>
                                        <Textarea
                                            id="contact-message"
                                            rows={6}
                                            data-testid="textarea-contact-message"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full sm:w-auto" data-testid="button-contact-submit">
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

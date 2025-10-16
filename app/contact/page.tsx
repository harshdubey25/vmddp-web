"use client"
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";

const contactFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    mobile: z.string()
        .regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits")
        .refine(val => /^[6-9]/.test(val), { message: "Mobile number must start with 6, 7, 8, or 9" }),
    districtId: z.string().min(1, "Please select a district"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Contact() {
    const { toast } = useToast();
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const [sent, setSent] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: "",
            email: "",
            mobile: "",
            districtId: "",
            message: "",
        },
    });

    const { data: frappeDistricts, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        limit: 100,
    });
    const districts = frappeDistricts ? frappeDistricts.map((d: any) => d.name1) : [];

    const onSubmit = async (data: any) => {
        toast({
            title: "Message Sent",
            description: "Thank you for contacting us. We will get back to you soon.",
        });
        // TODO: Replace with actual send logic (API call to send message to DPO)
        setSent(false);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSent(true);
        reset();
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
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-name">Full Name *</Label>
                                            <Input id="contact-name" data-testid="input-contact-name" required {...register("name")} />
                                            {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name.message as string}</div>}
                                        </div>
                                      
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-mobile">Mobile Number *</Label>
                                            <Input
                                                id="contact-mobile"
                                                type="tel"
                                                data-testid="input-contact-mobile"
                                                required
                                                maxLength={10}
                                                pattern="[0-9]{10}"
                                                inputMode="numeric"
                                                {...register("mobile")}
                                            />
                                            {errors.mobile && <div className="text-red-600 text-sm mt-1">{errors.mobile.message as string}</div>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-district">Select District</Label>
                                            <select
                                                id="contact-district"
                                                className="w-full border rounded px-3 py-2 mt-1"
                                                {...register("districtId")}
                                                required
                                            >
                                                <option value="">Select District</option>
                                                {districtsLoading ? (
                                                    <option value="" disabled>Loading...</option>
                                                ) : (
                                                    districts.map((district: string) => (
                                                        <option key={district} value={district}>{district}</option>
                                                    ))
                                                )}
                                            </select>
                                            {errors.districtId && <div className="text-red-600 text-sm mt-1">{errors.districtId.message as string}</div>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-message">Message *</Label>
                                        <Textarea
                                            id="contact-message"
                                            rows={6}
                                            data-testid="textarea-contact-message"
                                            required
                                            {...register("message")}
                                        />
                                        {errors.message && <div className="text-red-600 text-sm mt-1">{errors.message.message as string}</div>}
                                    </div>
                                    <Button type="submit" className="w-full sm:w-auto" data-testid="button-contact-submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Sending..." : "Send Message To DPO"}
                                    </Button>
                                    {sent && <div className="text-green-600 text-center mt-2">Message sent successfully!</div>}
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";

export default function Contact() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [sent, setSent] = useState(false);

    const contactFormSchema = z.object({
        name: z.string().min(2, t('name_min_chars')),
        mobile: z.string()
            .regex(/^[0-9]{10}$/, t('mobile_10_digits'))
            .refine(val => /^[6-9]/.test(val), { message: t('mobile_start_6789') }),
        districtId: z.string().min(1, t('select_district_required')),
        message: z.string().min(10, t('message_min_chars')),
    });

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: "",
            // email: "",
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

    const { createDoc, loading: creatingDoc } = useFrappeCreateDoc();

    const onSubmit = async (data: any) => {
        try {
            await createDoc("Contact Us", {
                district: data.districtId,
                full_name: data.name,
                mobile_number: data.mobile,
                message: data.message,
            });
            toast({
                title: t('message_sent_title'),
                description: t('message_sent_description'),
            });
            setSent(true);
            reset();
        } catch (error) {
            toast({
                title: t('error'),
                description: t('message_send_error'),
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-contact-title">
                        {t('contact_dpo_title')}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('contact_dpo_subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card data-testid="card-contact-info">
                            <CardContent className="p-6">
                                <h3 className="font-display font-semibold text-lg mb-4">{t('programme_office')}</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm mb-1">{t('main_office')}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t('main_office_address').split('\n').map((line, i) => (
                                                    <span key={i}>
                                                        {line}
                                                        {i < t('main_office_address').split('\n').length - 1 && <br />}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    </div>
                                    {/* <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm mb-1">{t('phone')}</p>
                                            <p className="text-sm text-muted-foreground">1800-XXX-XXXX</p>
                                        </div>
                                    </div> */}
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm mb-1">{t('email')}</p>
                                            <p className="text-sm text-muted-foreground">pdvmddpnagpur@gmail.com</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-display font-semibold text-lg mb-2">{t('office_hours')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('office_hours_schedule').split('\n').map((line, i) => (
                                        <span key={i}>
                                            {line}
                                            {i < t('office_hours_schedule').split('\n').length - 1 && <br />}
                                        </span>
                                    ))}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-display font-semibold text-lg mb-6">{t('send_us_message')}</h3>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-name">{t('full_name')} *</Label>
                                            <Input id="contact-name" data-testid="input-contact-name" required {...register("name")} />
                                            {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name.message as string}</div>}
                                        </div>

                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-mobile">{t('mobile_number')} *</Label>
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
                                            <Label htmlFor="contact-district">{t('select_district')}</Label>
                                            <select
                                                id="contact-district"
                                                className="w-full border rounded px-3 py-2 mt-1"
                                                {...register("districtId")}
                                                required
                                            >
                                                <option value="">{t('select_district')}</option>
                                                {districtsLoading ? (
                                                    <option value="" disabled>{t('loading')}</option>
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
                                        <Label htmlFor="contact-message">{t('message')} *</Label>
                                        <Textarea
                                            id="contact-message"
                                            rows={6}
                                            data-testid="textarea-contact-message"
                                            required
                                            {...register("message")}
                                        />
                                        {errors.message && <div className="text-red-600 text-sm mt-1">{errors.message.message as string}</div>}
                                    </div>
                                    <Button type="submit" className="w-full sm:w-auto" data-testid="button-contact-submit" disabled={creatingDoc}>
                                        {creatingDoc ? t('sending') : t('send_message_to_dpo')}
                                    </Button>
                                    {sent && <div className="text-green-600 text-center mt-2">{t('message_sent_success')}</div>}
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

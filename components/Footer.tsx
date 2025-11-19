"use client"

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation('common');
  return (
    <footer className="relative bg-muted/50 border-t overflow-hidden text-white">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/stock_images/footer_imag.png')" }}
        aria-hidden="true"
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/70 z-10" aria-hidden="true" />
      <div className="relative z-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <img src="/logo_vmddp.jpg" alt="VMDDP Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
              <div>
                <h3 className="font-display font-semibold text-base sm:text-lg">VMDDP</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-white leading-relaxed">
              {t('footer_description')}
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3 sm:mb-4 text-base sm:text-base">{t('footer_quick_links')}</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {[
                { labelKey: "home" as const, path: "/" },
                { labelKey: "about_us" as const, path: "/about" },
                { labelKey: "beneficiaries" as const, path: "/beneficiaries" },
                { labelKey: "register_now" as const, path: "/register" },
                { labelKey: "track_application" as const, path: "/track" },
                { labelKey: "contact_us" as const, path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-xs sm:text-sm text-white hover:text-primary transition-colors" data-testid={`link-footer-${link.labelKey.replace(/_/g, '-')}`}>
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3 sm:mb-4 text-base sm:text-base">{t('footer_contact_info')}</h4>
            <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-white leading-relaxed">
                {t('footer_address').split('\n').map((line, idx) => (
                  <span key={idx}>
                    {line}
                    {idx !== t('footer_address').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-white">
          <p>{t('footer_copyright')}</p>
          <p className="mt-1.5 sm:mt-2">{t('footer_developed_by')}</p>
        </div>
      </div>
    </footer>
  );
}

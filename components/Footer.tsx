import Link from "next/link";
import { MapPin } from "lucide-react";
import { getServerTranslations } from '@/lib/server-translations';

export default async function Footer() {
  const { t } = await getServerTranslations();
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
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo_vmddp.jpg" alt="VMDDP Logo" className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-display font-semibold text-lg">VMDDP</h3>
              </div>
            </div>
            <p className="text-sm text-white">
              {t('footer_description')}
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t('footer_quick_links')}</h4>
            <ul className="space-y-2">
              {[
                { labelKey: "home" as const, path: "/" },
                { labelKey: "about_us" as const, path: "/about" },
                { labelKey: "beneficiaries" as const, path: "/beneficiaries" },
                { labelKey: "register_now" as const, path: "/register" },
                { labelKey: "track_application" as const, path: "/track" },
                { labelKey: "contact_us" as const, path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-white hover:text-primary transition-colors" data-testid={`link-footer-${link.labelKey.replace(/_/g, '-')}`}>
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t('footer_contact_info')}</h4>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-white">
                {t('footer_address')}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-white">
          <p>{t('footer_copyright')}</p>
          <p className="mt-2">{t('footer_developed_by')}</p>
        </div>
      </div>
    </footer>
  );
}

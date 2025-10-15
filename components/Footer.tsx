import Link from "next/link";
import { MapPin } from "lucide-react";

export default function Footer() {
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
              Empowering dairy farmers across Vidarbha and Marathwada regions through comprehensive scheme support and digital transparency.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", path: "/" },
                { label: "About Us", path: "/about" },
                { label: "Beneficiaries", path: "/beneficiaries" },
                { label: "Register", path: "/register" },
                { label: "Track Application", path: "/track" },
                { label: "Contact Us", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-white hover:text-primary transition-colors" data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}> 
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Contact Information</h4>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-white">
                Mother Dairy near WCL Office,<br />
                Civil Line Road, Seminary Hills-440006
              </p>
            </div>
          </div>
        </div>

  <div className="border-t mt-8 pt-8 text-center text-sm text-white">
          <p>© {new Date().getFullYear()} VMDDP - Vidarbha Marathwada Dairy Development Programme. All rights reserved.</p>
          <p className="mt-2">Developed by Klaimify Private Limited | CIN: U72900PN2020PTC190748</p>
        </div>
      </div>
    </footer>
  );
}

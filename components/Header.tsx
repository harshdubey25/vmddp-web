"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import { useTranslation } from 'next-i18next';
export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t, i18n } = useTranslation('common');

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "Track Application", path: "/track" },
    { label: "Beneficiaries", path: "/beneficiaries" },
    { label: "Gallery", path: "/gallery" },
    { label: "Contact Us", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Bottom strip: logo, nav, register, mobile menu */}
      <div className="w-full bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo_vmddp.jpg" alt="VMDDP Logo" className="w-12 h-12 rounded-full" />
            <div className="hidden sm:block">
              <h1 className="font-display font-semibold text-lg">VMDDP</h1>
              <p className="text-xs text-muted-foreground">{t('dairy_development_programme')}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} passHref>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={isActive ? "font-bold" : ""}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/register" passHref>
              <Button data-testid="button-register" className="hidden sm:inline-flex">
                Register Now
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <select
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
              value={i18n.language ?? "en"}
              onChange={e => i18n.changeLanguage(e.target.value)}
              data-testid="select-language-toggle"
            >
              <option value="en">English</option>
              <option value="mr">मराठी</option>
            </select>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} passHref legacyBehavior>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Link href="/register" passHref legacyBehavior>
              <Button
                className="w-full"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="button-mobile-register"
              >
                Register Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

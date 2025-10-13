"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import { useTranslation } from 'next-i18next';
import { i18n } from 'next-i18next';
export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation('common');

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "Track Application", path: "/track" },
    { label: "Beneficiaries", path: "/beneficiaries" },
    { label: "Gallery", path: "/gallery" },
    { label: "Contact Us", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-semibold text-lg">VMDDP</h1>
              <p className="text-xs text-muted-foreground">{t('dairy_development_programme')}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} passHref >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/register" passHref >
              <Button data-testid="button-register" className="hidden sm:inline-flex">
                Register Now
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                const current = i18n?.language ?? "en";
                const next = current === "en" ? "mr" : "en";
                i18n?.changeLanguage?.(next);
                console.log('buttonPrress', current)
              }}

              data-testid="button-language-toggle"
            >
              {(i18n?.language ?? "en") === "en" ? "मराठी" : "English"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

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

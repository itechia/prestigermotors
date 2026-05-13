import React, { Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Car, Tag, Home, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useStoreSettings } from "@/lib/useStoreSettings";
import ThemeToggle from "@/components/ThemeToggle";
import BrandHead from "@/components/BrandHead";
import SiteFooter from "@/components/SiteFooter";
import { getStoreNameFontStyle } from "@/lib/fonts";

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const settings = useStoreSettings();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user ? { ...user, role: "admin" } : null;
    },
    enabled: !!isAuthenticated,
  });

  const isAdmin = me?.role === "admin";

  // App é público. Admin vê aba extra apenas se estiver logado como admin.
  const navItems = [
    { to: "/", label: "Catálogo", icon: Home },
    { to: "/vender", label: "Vender", icon: Tag },
  ];
  if (isAdmin) navItems.push({ to: "/admin", label: "Admin", icon: LayoutGrid });

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BrandHead />
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.store_name}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <Car className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
            )}
            <span
              className="text-lg sm:text-xl tracking-tight truncate"
              style={getStoreNameFontStyle(settings.store_name_font)}
            >
              {settings.store_name}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-safe flex flex-col">
        <Suspense fallback={
          <div className="flex-1 min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer and mobile nav are hidden on admin pages */}
      {!isAdminRoute && <SiteFooter />}
      {!isAdminRoute && <div className="h-16 md:hidden" aria-hidden="true" />}

      {/* Mobile Bottom Nav */}
      {!isAdminRoute && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50">
          <div
            className="grid h-16"
            style={{
              gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
              paddingBottom: "var(--safe-bottom)",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon
                    className={cn("w-5 h-5", active && "scale-110")}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
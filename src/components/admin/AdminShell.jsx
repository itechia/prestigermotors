'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Car,
  Settings,
  ExternalLink,
  Inbox,
  ReceiptText,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronRight,
  UserCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { getStoreNameFontStyle } from "@/lib/fonts";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import AdminGuard from "./AdminGuard";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/veiculos", label: "Veículos", icon: Car },
  { to: "/admin/vendas", label: "Vendas", icon: ReceiptText },
  { to: "/admin/propostas", label: "Propostas", icon: Inbox },
  { to: "/admin/usuarios", label: "Usuários", icon: Users, adminOnly: true },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

const MODULE_BY_ROUTE = {
  "/admin": "dashboard",
  "/admin/veiculos": "veiculos",
  "/admin/vendas": "vendas",
  "/admin/propostas": "propostas",
  "/admin/usuarios": "usuarios",
  "/admin/configuracoes": "configuracoes",
};

const STORAGE_KEY = "admin_sidebar_collapsed";

function NavItem({ item, collapsed, onClick }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = item.end
    ? pathname === item.to
    : pathname.startsWith(item.to);

  return (
    <Link
      href={item.to}
      title={collapsed ? item.label : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 h-10 rounded-lg text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function AdminShell({ children, title, subtitle, actions }) {
  const settings = useStoreSettings();
  const { profile, realProfile, simulation, isSimulating, stopSimulation, logout } = useAuth();
  const loggedProfile = realProfile || profile;
  const loggedName = loggedProfile?.nome || loggedProfile?.email || "Admin";
  const loggedRole = loggedProfile?.role === "super_admin"
    ? "Super admin"
    : loggedProfile?.role === "admin"
      ? "Admin"
      : "Vendedor";
  const navItems = NAV.filter((item) => {
    const roleAllowed = !item.adminOnly || ["admin", "super_admin"].includes(profile?.role);
    const moduleKey = MODULE_BY_ROUTE[item.to];
    const moduleAllowed = profile?.role === "super_admin" || profile?.module_access?.[moduleKey] !== false;
    return roleAllowed && moduleAllowed;
  });

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const handleLogout = async () => {
    toast.success("Sessão encerrada");
    await logout("/admin/login");
  };

  const sidebarW = collapsed ? "w-[72px]" : "w-[260px]";

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* ── Sidebar (desktop) ── */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r border-border/60 bg-card shrink-0 transition-[width] duration-200 ease-out",
            sidebarW
          )}
        >
          {/* Logo / Brand */}
          {collapsed ? (
            <div className="h-16 flex items-center justify-center border-b border-border/40 shrink-0">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                title="Expandir menu"
                aria-label="Expandir menu"
              >
                <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border/40 shrink-0">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.store_name}
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                </div>
              )}
              <span
                className="text-sm font-semibold truncate flex-1"
                style={getStoreNameFontStyle(settings.store_name_font)}
              >
                {settings.store_name || "Painel Admin"}
              </span>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors shrink-0"
                title="Recolher menu"
                aria-label="Recolher menu"
              >
                <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </nav>

          {/* Bottom controls */}
          <div className="px-3 py-3 border-t border-border/40 space-y-1.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 h-9 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors",
                collapsed ? "justify-center px-0" : "px-3"
              )}
              title="Ver site"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>Ver site</span>}
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 h-9 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full",
                collapsed ? "justify-center px-0" : "px-3"
              )}
              title="Sair"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* ── Mobile sidebar overlay ── */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setMobileOpen(false)}
          >
            <aside
              className="w-[280px] h-full bg-card border-r border-border/60 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border/40">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt={settings.store_name} width={32} height={32} className="h-8 w-auto object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Car className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                  </div>
                )}
                <span className="text-sm font-semibold truncate" style={getStoreNameFontStyle(settings.store_name_font)}>
                  {settings.store_name || "Painel Admin"}
                </span>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    collapsed={false}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
              <div className="px-3 py-3 border-t border-border/40 space-y-1.5">
                <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" /> Ver site
                </a>
                <button onClick={handleLogout} className="flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full" aria-label="Sair da conta">
                  <LogOut className="w-4 h-4" aria-hidden="true" /> Sair
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          {isSimulating && (
            <div className="h-11 flex items-center justify-between gap-3 px-4 lg:px-8 border-b border-amber-200 bg-amber-50 text-amber-900 text-sm shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  Simulando {simulation?.nome || simulation?.email} ({simulation?.role}) como {realProfile?.email}
                </span>
              </div>
              <Button variant="outline" size="sm" className="h-8 rounded-full bg-white" onClick={stopSimulation}>
                Encerrar
              </Button>
            </div>
          )}
          <header className="h-16 flex items-center justify-between gap-4 px-4 lg:px-8 border-b border-border/40 bg-card/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Abrir menu"
              >
                <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Breadcrumb-style title */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                <Link href="/admin" className="hover:text-foreground transition-colors shrink-0">
                  Painel
                </Link>
                {title && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-foreground truncate">{title}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 min-w-0 rounded-full border border-border/60 bg-background px-3 py-1.5">
                <UserCircle className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-semibold truncate max-w-[180px]">{loggedName}</div>
                  <div className="text-[10px] text-muted-foreground">{loggedRole}</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
              {/* Page header */}
              {(title || actions) && (
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                  <div>
                    {title && (
                      <h1 className="font-display font-bold text-2xl md:text-3xl text-balance">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    )}
                  </div>
                  {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}

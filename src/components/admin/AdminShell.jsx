import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Settings,
  ArrowLeft,
  ExternalLink,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminGuard from "./AdminGuard";

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/veiculos", label: "Veículos", icon: Car },
  { to: "/admin/propostas", label: "Propostas", icon: Inbox },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

const STORAGE_KEY = "admin_sidebar_collapsed";

export default function AdminShell({ children, title, subtitle, actions }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pt-safe">
        {/* Top strip */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao site
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver site <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div
          className={cn(
            "grid gap-8 transition-[grid-template-columns] duration-300",
            collapsed
              ? "lg:grid-cols-[64px_1fr]"
              : "lg:grid-cols-[240px_1fr]"
          )}
        >
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className={cn("mb-4 hidden lg:flex items-center justify-between gap-2", collapsed && "justify-center")}>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Painel
                  </p>
                  <h2 className="font-display font-bold text-lg mt-0.5">
                    Administração
                  </h2>
                </div>
              )}
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors flex-shrink-0"
                title={collapsed ? "Expandir menu" : "Recolher menu"}
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Mobile heading (always shown on mobile, sidebar is horizontal there) */}
            <div className="mb-4 lg:hidden">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Painel
              </p>
              <h2 className="font-display font-bold text-lg mt-0.5">
                Administração
              </h2>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                        collapsed && "lg:justify-center lg:px-2",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            {(title || actions) && (
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                <div>
                  {title && <h1 className="font-display font-bold text-2xl md:text-3xl">{title}</h1>}
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
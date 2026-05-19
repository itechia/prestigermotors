'use client';

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminGuard({ children, adminOnly = false }) {
  const { isAuthenticated, isLoadingAuth, isLoadingProfile, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoadingAuth && !isLoadingProfile && isAuthenticated && profile?.must_change_password && pathname !== "/admin/alterar-senha") {
      router.replace("/admin/alterar-senha");
    }
  }, [isAuthenticated, isLoadingAuth, isLoadingProfile, pathname, profile?.must_change_password, router]);

  if (isLoadingAuth || (isAuthenticated && isLoadingProfile)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Área restrita</h2>
        <p className="text-muted-foreground mt-2">
          Esta área é exclusiva para administradores da loja.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Button asChild variant="outline" className="rounded-full h-12 px-6 font-semibold">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" /> Voltar ao site
            </Link>
          </Button>
          <Button asChild className="rounded-full h-12 px-6 font-semibold">
            <Link href="/admin/login">
              <LogIn className="w-4 h-4 mr-2" /> Entrar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!profile?.active) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Acesso bloqueado</h2>
        <p className="text-muted-foreground mt-2">
          Seu usuário está inativo. Fale com um administrador da loja.
        </p>
      </div>
    );
  }

  if (profile?.must_change_password && pathname !== "/admin/alterar-senha") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (adminOnly && profile?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Permissão insuficiente</h2>
        <p className="text-muted-foreground mt-2">
          Esta página é exclusiva para administradores.
        </p>
      </div>
    );
  }

  return children;
}

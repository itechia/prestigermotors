'use client';

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const MODULE_BY_PATH = [
  { prefix: "/admin/veiculos", module: "veiculos" },
  { prefix: "/admin/veiculo", module: "veiculos" },
  { prefix: "/admin/vendas", module: "vendas" },
  { prefix: "/admin/propostas", module: "propostas" },
  { prefix: "/admin/usuarios", module: "usuarios" },
  { prefix: "/admin/configuracoes", module: "configuracoes" },
  { prefix: "/admin", module: "dashboard", exact: true },
];

function getModuleForPath(pathname) {
  return MODULE_BY_PATH.find((item) => item.exact ? pathname === item.prefix : pathname.startsWith(item.prefix))?.module;
}

export default function AdminGuard({ children, adminOnly = false }) {
  const {
    isAuthenticated,
    isLoadingAuth,
    isLoadingProfile,
    profile,
    authError,
    logout,
    isSimulating,
    stopSimulation,
  } = useAuth();
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
        <h2 className="font-display font-bold text-2xl md:text-3xl">Area restrita</h2>
        <p className="text-muted-foreground mt-2">
          Esta area e exclusiva para administradores da loja.
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

  if (profile?.active === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Acesso bloqueado</h2>
        <p className="text-muted-foreground mt-2">
          Seu usuario esta inativo. Fale com um administrador da loja.
        </p>
      </div>
    );
  }

  if (isAuthenticated && !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Perfil nao carregado</h2>
        <p className="text-muted-foreground mt-2">
          Nao foi possivel validar seu perfil administrativo. Entre novamente e, se continuar, confira as variaveis do Supabase na Vercel.
        </p>
        {authError && (
          <p className="text-sm text-destructive mt-3">
            Detalhe: {authError}
          </p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <Button onClick={() => logout("/admin/login")} className="rounded-full h-12 px-6 font-semibold">
            <LogIn className="w-4 h-4 mr-2" /> Entrar novamente
          </Button>
        </div>
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

  const moduleKey = getModuleForPath(pathname);
  if (moduleKey && profile?.role !== "super_admin" && profile?.module_access?.[moduleKey] === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Modulo bloqueado</h2>
        <p className="text-muted-foreground mt-2">
          Este modulo nao esta liberado para o seu perfil.
        </p>
        {isSimulating && (
          <Button onClick={stopSimulation} className="rounded-full h-12 px-6 font-semibold mt-6">
            Encerrar simulacao
          </Button>
        )}
      </div>
    );
  }

  if (adminOnly && !["admin", "super_admin"].includes(profile?.role)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">Permissao insuficiente</h2>
        <p className="text-muted-foreground mt-2">
          Esta pagina e exclusiva para administradores.
        </p>
        {isSimulating && (
          <Button onClick={stopSimulation} className="rounded-full h-12 px-6 font-semibold mt-6">
            Encerrar simulacao
          </Button>
        )}
      </div>
    );
  }

  return children;
}

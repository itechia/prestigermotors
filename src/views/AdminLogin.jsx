'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Car } from "lucide-react";
import { toast } from "sonner";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { getStoreNameFontStyle } from "@/lib/fonts";

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const settings = useStoreSettings();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);

  // Redireciona se já autenticado
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      const redirect = searchParams.get("redirect") || "/admin";
      router.replace(redirect);
    }
  }, [isAuthenticated, isLoadingAuth, router, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    const redirect = searchParams.get("redirect") || "/admin";
    router.replace(redirect);
  };

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / identidade da loja */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.store_name}
              width={64}
              height={64}
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {settings.store_name ? (
                <span
                  className="text-2xl font-bold text-primary"
                  style={getStoreNameFontStyle(settings.store_name_font)}
                >
                  {settings.store_name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <Car className="w-8 h-8 text-primary" aria-hidden="true" />
              )}
            </div>
          )}
          {settings.store_name && (
            <span
              className="text-xl tracking-tight font-semibold"
              style={getStoreNameFontStyle(settings.store_name_font)}
            >
              {settings.store_name}
            </span>
          )}
        </div>

        <h1 className="text-center font-display font-bold text-2xl mb-1">
          Área administrativa
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Entre com sua conta para gerenciar a loja
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@prestiger.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full font-semibold text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          <Link href="/" className="underline underline-offset-2 hover:text-foreground">
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}

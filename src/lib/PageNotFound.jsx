'use client';

import React from "react";
import { usePathname } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  const pathname = usePathname();
  const pageName = pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center">
        <div className="space-y-2 mb-8">
          <h1 className="font-display text-8xl font-bold text-muted-foreground/30">404</h1>
          <div className="h-0.5 w-16 bg-border mx-auto" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
          Página não encontrada
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          {pageName ? (
            <>
              A página <span className="font-medium text-foreground">"/{pageName}"</span> não existe
              neste aplicativo.
            </>
          ) : (
            "A página que você procura não existe neste aplicativo."
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="rounded-full h-11 px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="rounded-full h-11 px-6"
          >
            <Home className="w-4 h-4 mr-2" /> Ir para o início
          </Button>
        </div>
      </div>
    </div>
  );
}

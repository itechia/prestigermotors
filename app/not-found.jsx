'use client';

import Link from 'next/link';
import { Car, Home, Tag, ArrowLeft, SearchX } from 'lucide-react';
import PublicLayout from '@/components/Layout';

// Página 404 personalizada: mantém cabeçalho, rodapé e caminhos de saída
// úteis em vez de deixar o visitante em um beco sem saída.
export default function NotFound() {
  return (
    <PublicLayout>
      <div className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          </div>

          <p className="font-display text-6xl md:text-7xl font-bold text-muted-foreground/25">404</p>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-2 mb-3">
            Essa página não existe (ou já foi vendida)
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-8">
            O endereço pode ter mudado, ou o veículo que você procurava saiu do
            estoque. Continue por aqui, o catálogo está sempre atualizado.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors"
            >
              <Car className="w-4 h-4" aria-hidden="true" />
              Ver veículos disponíveis
            </Link>
            <Link
              href="/vender"
              className="inline-flex items-center justify-center gap-2 rounded-full h-11 px-6 border border-input bg-background hover:bg-secondary text-sm font-semibold transition-colors"
            >
              <Tag className="w-4 h-4" aria-hidden="true" />
              Vender meu veículo
            </Link>
          </div>

          <div className="flex items-center justify-center gap-5 mt-8 text-sm">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Voltar
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              Início
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

// Esqueletos de carregamento reutilizados pelos arquivos loading.jsx de cada
// rota. Mantêm a mesma silhueta do conteúdo final para evitar "salto" de layout.

export function CatalogSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 md:pt-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o catálogo de veículos…</span>
      <div className="h-40 md:h-56 lg:h-64 rounded-2xl md:rounded-3xl bg-secondary animate-pulse" />

      <div className="flex gap-2 mt-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-24 rounded-full bg-secondary animate-pulse flex-shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-3xl overflow-hidden border border-border/50 animate-pulse">
            <div className="aspect-[4/3] bg-secondary" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-secondary rounded w-2/3" />
              <div className="h-3 bg-secondary rounded w-1/2" />
              <div className="h-6 bg-secondary rounded w-1/2 mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VehicleDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o veículo…</span>
      <div className="h-4 w-32 bg-secondary rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-3">
          <div className="aspect-[4/3] rounded-3xl bg-secondary animate-pulse" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-secondary rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-secondary rounded w-1/2 animate-pulse" />
          <div className="h-10 bg-secondary rounded w-2/3 animate-pulse" />
          <div className="h-12 bg-secondary rounded-full animate-pulse" />
          <div className="h-12 bg-secondary rounded-full animate-pulse" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando a página…</span>
      <div className="h-4 w-36 bg-secondary rounded animate-pulse mb-6" />
      <div className="h-9 w-2/3 bg-secondary rounded animate-pulse mb-3" />
      <div className="h-3 w-40 bg-secondary rounded animate-pulse mb-8" />
      <div className="bg-card border border-border rounded-2xl p-6 md:p-10 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 bg-secondary rounded animate-pulse"
            style={{ width: `${[100, 96, 88, 70, 100, 92, 80, 100, 66, 84][i]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-12 pb-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o formulário…</span>
      <div className="text-center space-y-3 mb-10">
        <div className="h-6 w-48 bg-secondary rounded-full animate-pulse mx-auto" />
        <div className="h-10 w-3/4 bg-secondary rounded animate-pulse mx-auto" />
        <div className="h-4 w-1/2 bg-secondary rounded animate-pulse mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-card rounded-3xl p-5 md:p-6 border border-border/50 mb-5 space-y-4">
          <div className="h-5 w-40 bg-secondary rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-11 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        </div>
      ))}
      <div className="h-12 rounded-full bg-secondary animate-pulse" />
    </div>
  );
}

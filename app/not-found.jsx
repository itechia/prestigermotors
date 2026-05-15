'use client';

export default function NotFound() {
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
          A página que você procura não existe neste aplicativo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-full h-11 px-6 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center justify-center rounded-full h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            Ir para o início
          </button>
        </div>
      </div>
    </div>
  );
}

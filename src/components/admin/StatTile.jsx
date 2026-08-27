import React from "react";

// Card único de "rótulo + valor" para tiras de estatística no admin.
// Substitui as implementações redundantes que existiam por página
// (Metric em Usuários/Vendas, StatCard no Dashboard, StatusChip em Propostas).
// Um único tratamento neutro de ícone em todo o admin — nada de cores
// pastel diferentes por card, que ficavam parecendo caixinhas brancas
// aleatórias de página pra página.
export default function StatTile({ icon: Icon, label, value, loading, compact = false }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 md:p-5">
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-secondary text-foreground flex items-center justify-center mb-3">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      )}
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className={`font-display font-bold mt-0.5 ${compact ? "text-base" : "text-xl md:text-2xl"}`}>
        {loading ? "-" : value}
      </div>
    </div>
  );
}

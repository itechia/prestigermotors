import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";

// Casca visual compartilhada pelas páginas legais (privacidade e termos).
export default function LegalArticle({ title, intro, updatedAt, content }) {
  const updated = new Date(updatedAt || Date.now()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Voltar para o início
      </Link>

      <h1 className="font-display font-bold text-3xl md:text-4xl text-balance mb-2">{title}</h1>
      {intro && <p className="text-sm text-muted-foreground mb-1">{intro}</p>}
      <p className="text-xs text-muted-foreground mb-8">Atualizada em {updated}</p>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-10">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}

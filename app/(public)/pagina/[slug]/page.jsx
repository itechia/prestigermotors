import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";
import { getCachedSitePage, getCachedStoreName } from "@/lib/serverPublicData";

function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

export async function generateMetadata({ params }) {
  const [page, storeName] = await Promise.all([
    getCachedSitePage(params.slug),
    getCachedStoreName(),
  ]);

  if (!page) {
    return { title: `Página não encontrada | ${storeName}` };
  }

  return {
    title: `${page.title} | ${storeName}`,
    description: `${page.title} — ${storeName}.`,
    alternates: { canonical: `${getBaseUrl()}/pagina/${page.slug}` },
  };
}

export default async function Page({ params }) {
  const page = await getCachedSitePage(params.slug);
  if (!page || page.kind === "link") notFound();

  const updated = new Date(page.updated_date).toLocaleDateString("pt-BR", {
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

      <h1 className="font-display font-bold text-3xl md:text-4xl text-balance mb-2">{page.title}</h1>
      <p className="text-xs text-muted-foreground mb-8">Atualizado em {updated}</p>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-10">
        <MarkdownContent content={page.body_markdown} />
      </div>
    </div>
  );
}

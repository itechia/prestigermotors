import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";
import { getCachedSitePage, getCachedStoreName } from "@/lib/serverPublicData";
import { getBaseUrl } from "@/lib/siteUrl";

export async function generateMetadata({ params }) {
  const [page, storeName] = await Promise.all([
    getCachedSitePage(params.slug),
    getCachedStoreName(),
  ]);

  if (!page) {
    return {
      title: "Página não encontrada",
      description: `Esta página não está mais disponível. Veja o catálogo da ${storeName}.`,
      robots: { index: false, follow: true },
    };
  }

  const excerpt = String(page.body_markdown || "")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
  const description = excerpt || `${page.title} — ${storeName}.`;
  const url = `${getBaseUrl()}/pagina/${page.slug}`;

  return {
    title: page.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} | ${storeName}`,
      description,
      url,
      type: "article",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: storeName }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description,
      images: ["/opengraph-image.png"],
    },
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

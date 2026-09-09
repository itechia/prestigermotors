import LegalArticle from "@/components/LegalArticle";
import { termsMarkdown } from "@/lib/legalContent";
import { getCachedPublicSettings, getCachedSitePage } from "@/lib/serverPublicData";

export const revalidate = 3600;

export async function generateMetadata() {
  const settings = await getCachedPublicSettings().catch(() => null);
  const storeName = settings?.store_name || "Prestiger Motors";
  const description = `Condições de uso do site da ${storeName}: regras dos anúncios, disponibilidade dos veículos, contato pelos formulários e responsabilidades das partes.`;

  return {
    title: "Termos de Uso",
    description,
    alternates: { canonical: "/termos" },
    openGraph: {
      title: `Termos de Uso | ${storeName}`,
      description,
      url: "/termos",
      type: "article",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: storeName }],
    },
  };
}

export default async function Page() {
  const [settings, custom] = await Promise.all([
    getCachedPublicSettings().catch(() => null),
    getCachedSitePage("termos").catch(() => null),
  ]);

  const isCustom = custom && custom.kind !== "link" && custom.body_markdown?.trim();

  return (
    <LegalArticle
      title={isCustom ? custom.title : "Termos de Uso"}
      intro={`Regras de utilização do site de ${settings?.store_name || "nossa loja"}.`}
      updatedAt={isCustom ? custom.updated_date : settings?.updated_date}
      content={isCustom ? custom.body_markdown : termsMarkdown(settings)}
    />
  );
}

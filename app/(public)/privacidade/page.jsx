import LegalArticle from "@/components/LegalArticle";
import { privacyMarkdown } from "@/lib/legalContent";
import { getCachedPublicSettings, getCachedSitePage } from "@/lib/serverPublicData";

export const revalidate = 3600;

export async function generateMetadata() {
  const settings = await getCachedPublicSettings().catch(() => null);
  const storeName = settings?.store_name || "Prestiger Motors";
  const description = `Como a ${storeName} coleta, usa e protege os seus dados pessoais, de acordo com a LGPD. Saiba quais informações guardamos e como exercer seus direitos.`;

  return {
    title: "Política de Privacidade",
    description,
    alternates: { canonical: "/privacidade" },
    openGraph: {
      title: `Política de Privacidade | ${storeName}`,
      description,
      url: "/privacidade",
      type: "article",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: storeName }],
    },
  };
}

export default async function Page() {
  const [settings, custom] = await Promise.all([
    getCachedPublicSettings().catch(() => null),
    getCachedSitePage("privacidade").catch(() => null),
  ]);

  const isCustom = custom && custom.kind !== "link" && custom.body_markdown?.trim();

  return (
    <LegalArticle
      title={isCustom ? custom.title : "Política de Privacidade"}
      intro={`Tratamento de dados pessoais em ${settings?.store_name || "nossa loja"}.`}
      updatedAt={isCustom ? custom.updated_date : settings?.updated_date}
      content={isCustom ? custom.body_markdown : privacyMarkdown(settings)}
    />
  );
}

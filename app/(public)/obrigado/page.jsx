import ThankYou from "@/views/ThankYou";
import { getCachedStoreName } from "@/lib/serverPublicData";

export async function generateMetadata() {
  const storeName = await getCachedStoreName().catch(() => "Prestiger Motors");

  return {
    title: "Obrigado pelo contato",
    description: `Recebemos a sua solicitação. A equipe da ${storeName} entra em contato em até 24 horas úteis.`,
    alternates: { canonical: "/obrigado" },
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <ThankYou />;
}

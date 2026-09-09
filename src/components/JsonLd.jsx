// Dados estruturados (schema.org) — ajudam Google/Bing a entender a loja,
// o endereço de contato e cada veículo anunciado.
export default function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // O conteúdo é gerado no servidor a partir das configurações da loja.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}

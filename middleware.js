import { NextResponse } from "next/server";

// Links de veículo antigos (com o UUID) são redirecionados com 308 para a URL
// com slug. Feito no middleware porque só aqui conseguimos responder com um
// redirecionamento HTTP de verdade, antes de a página começar a ser enviada —
// é o que preserva o SEO dos links já compartilhados no WhatsApp.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O matcher já filtra pelo formato de UUID: em URLs com slug o middleware
// nem chega a rodar.
export const config = {
  matcher:
    "/veiculo/:key([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})",
};

export async function middleware(request) {
  const segments = request.nextUrl.pathname.split("/");
  const key = decodeURIComponent(segments[2] || "");

  // URLs que já usam slug seguem direto: só um teste de regex por requisição.
  if (!UUID_RE.test(key)) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return NextResponse.next();

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/vehicles?id=eq.${encodeURIComponent(key)}&select=slug&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) return NextResponse.next();

    const rows = await response.json();
    const slug = Array.isArray(rows) ? rows[0]?.slug : null;
    if (!slug) return NextResponse.next();

    const target = request.nextUrl.clone();
    target.pathname = `/veiculo/${slug}`;
    return NextResponse.redirect(target, 308);
  } catch {
    // Qualquer falha: deixa a própria página resolver o veículo pelo UUID.
    return NextResponse.next();
  }
}

import { NextResponse } from "next/server";
import { getVapidDetails } from "../../../_utils/pushSender";

export const runtime = "nodejs";

// Entrega ao navegador a chave pública VAPID. É pública por definição — o
// navegador precisa dela para criar a inscrição. A privada nunca sai daqui.
//
// Fica numa rota em vez de NEXT_PUBLIC_: trocar a chave passa a ser mudar a
// variável na Vercel, sem rebuild do site.
export async function GET() {
  const vapid = getVapidDetails();

  return NextResponse.json(
    { enabled: Boolean(vapid), publicKey: vapid?.publicKey || null },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}

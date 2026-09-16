import webpush from "web-push";

// Envio de Web Push com VAPID.
//
// As chaves ficam só no servidor (VAPID_PRIVATE_KEY tem o mesmo peso da
// service role do Supabase). A chave pública é entregue ao navegador pela
// rota /api/public/push/config — nunca por variável NEXT_PUBLIC_, assim
// trocar a chave não exige rebuild.

// Quanto tempo o serviço de push segura a mensagem se o aparelho estiver
// offline. 24h: promoção de hoje ainda faz sentido amanhã cedo, depois não.
const TTL_SECONDS = 24 * 60 * 60;

// Quantas notificações saem em paralelo. O gargalo é o tempo máximo da
// Function na Vercel, não o serviço de push; 50 mantém o lote rápido sem
// abrir conexões demais de uma vez.
const CHUNK_SIZE = 50;

export function getVapidDetails() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;

  // O subject precisa ser um mailto: ou uma URL — é o contato que o serviço
  // de push usa se algo der errado do lado deles.
  const subject = process.env.VAPID_SUBJECT || "mailto:contato@prestigermotors.com.br";

  return { subject, publicKey, privateKey };
}

export function isPushConfigured() {
  return getVapidDetails() !== null;
}

function toWebPushSubscription(row) {
  return {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };
}

// 404/410 = o navegador descartou a inscrição (app desinstalado, permissão
// revogada, cache limpo). Não é erro nosso: é só remover da lista.
function isGone(statusCode) {
  return statusCode === 404 || statusCode === 410;
}

/**
 * Dispara o mesmo payload para várias inscrições.
 * Devolve o resumo e quais endpoints devem sair da lista.
 */
export async function sendPushToSubscriptions(subscriptions, payload) {
  const vapidDetails = getVapidDetails();
  if (!vapidDetails) {
    throw new Error("Chaves VAPID nao configuradas.");
  }

  const body = JSON.stringify(payload);
  const result = { sent: 0, failed: 0, expired: 0, expiredEndpoints: [], lastError: null };

  for (let i = 0; i < subscriptions.length; i += CHUNK_SIZE) {
    const chunk = subscriptions.slice(i, i + CHUNK_SIZE);

    const outcomes = await Promise.allSettled(
      chunk.map((row) =>
        webpush.sendNotification(toWebPushSubscription(row), body, {
          TTL: TTL_SECONDS,
          urgency: "normal",
          vapidDetails,
        })
      )
    );

    outcomes.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") {
        result.sent += 1;
        return;
      }

      const statusCode = outcome.reason?.statusCode;
      if (isGone(statusCode)) {
        result.expired += 1;
        result.expiredEndpoints.push(chunk[index].endpoint);
        return;
      }

      result.failed += 1;
      result.lastError = outcome.reason?.body || outcome.reason?.message || "Falha desconhecida";
    });
  }

  return result;
}

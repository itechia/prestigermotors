// Gera o par de chaves VAPID usado para assinar as notificações push.
// Rode uma única vez: npm run push:keys
//
// As chaves identificam o servidor perante o serviço de push do navegador
// (FCM no Chrome/Android, Mozilla no Firefox, Apple no Safari). Se você trocar
// as chaves depois, TODAS as inscrições existentes param de funcionar e os
// visitantes precisam permitir de novo — então gere uma vez e guarde.
const webpush = require("web-push");

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log(`
Chaves VAPID geradas. Adicione na Vercel (Settings → Environment Variables)
e no .env.local para testar em desenvolvimento:

VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=mailto:contato@suaempresa.com.br

Atenção: VAPID_PRIVATE_KEY é secreta, mesmo nível da SUPABASE_SERVICE_ROLE_KEY.
Nunca use prefixo NEXT_PUBLIC_ nela. A chave pública é entregue ao navegador
pela rota /api/public/push/config.
`);

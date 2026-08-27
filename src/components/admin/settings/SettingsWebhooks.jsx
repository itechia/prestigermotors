import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Webhook,
  PlayCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/adminApi";

function Section({ title, desc, icon: Icon, children }) {
  return (
    <div className="bg-card rounded-2xl p-5 md:p-6 border border-border/50">
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h2 className="font-display font-bold text-lg">{title}</h2>
          {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function WebhookCard({
  title,
  description,
  enabledKey,
  urlKey,
  authEnabledKey,
  authUserKey,
  authPassKey,
  kind,
  payloadHint,
  form,
  update,
}) {
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const enabled = !!form[enabledKey];
  const url = form[urlKey] || "";
  const authEnabled = !!form[authEnabledKey];
  const authUser = form[authUserKey] || "";
  const authPass = form[authPassKey] || "";

  const handleTest = async () => {
    if (!url) {
      toast.error("Configure a URL do webhook antes de testar.");
      return;
    }
    setTesting(true);
    setLastResult(null);
    try {
      const data = await adminFetch("/api/test-webhook", {
        method: "POST",
        body: JSON.stringify({
          kind,
          url,
          auth_enabled: authEnabled,
          auth_user: authUser,
          auth_pass: authPass,
        }),
      });
      setLastResult(data);
      if (data.ok) {
        toast.success(`Webhook respondeu com status ${data.status}`);
      } else if (data.status) {
        toast.error(`Webhook respondeu com status ${data.status}`);
      } else {
        toast.error("Não foi possível chamar o webhook. Verifique a URL.");
      }
    } catch {
      toast.error("Não foi possível testar o webhook agora.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 md:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {enabled ? "Ativo" : "Inativo"}
          </span>
          <Switch checked={enabled} onCheckedChange={(v) => update(enabledKey, v)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">URL do webhook</Label>
          <Input
            value={url}
            onChange={(e) => update(urlKey, e.target.value)}
            placeholder="https://hooks.suaplataforma.com/..."
            className="rounded-xl"
          />
        </div>

        {/* Basic Auth — toggle + login/senha */}
        <div className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <Label className="text-xs font-medium">Autenticação Basic Auth</Label>
                <p className="text-[11px] text-muted-foreground">
                  Envia <code className="font-mono">Authorization: Basic ...</code> com usuário e senha.
                </p>
              </div>
            </div>
            <Switch
              checked={authEnabled}
              onCheckedChange={(v) => update(authEnabledKey, v)}
            />
          </div>

          {authEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Usuário</Label>
                <Input
                  value={authUser}
                  onChange={(e) => update(authUserKey, e.target.value)}
                  placeholder="login"
                  className="rounded-lg h-9"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Senha</Label>
                <Input
                  type="password"
                  value={authPass}
                  onChange={(e) => update(authPassKey, e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg h-9 font-mono text-xs"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={testing}
          className="rounded-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" /> Testar webhook
            </>
          )}
        </Button>
        {lastResult && (
          <div
            className={`text-xs flex items-center gap-1.5 ${
              lastResult.ok ? "text-green-700" : "text-destructive"
            }`}
          >
            {lastResult.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            Status {lastResult.status || "—"}
            {lastResult.response && (
              <span className="text-muted-foreground truncate max-w-xs">
                · {lastResult.response}
              </span>
            )}
          </div>
        )}
      </div>

      {payloadHint && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground select-none">
            Ver exemplo do payload enviado
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-background border border-border/60 overflow-auto text-[11px] leading-relaxed">
            {payloadHint}
          </pre>
        </details>
      )}
    </div>
  );
}

const INTEREST_PAYLOAD_EXAMPLE = `{
  "type": "interest",
  "sent_at": "2026-05-06T14:30:00.000Z",
  "store": {
    "name": "Sua Loja",
    "whatsapp": "5511999999999",
    "phone": "1133334444"
  },
  "vehicle": {
    "id": "abc123",
    "url": "https://seusite.com/veiculo/abc123",
    "brand": "Toyota",
    "model": "Corolla",
    "version": "XEi 2.0",
    "year": 2024,
    "manufacture_year": 2023,
    "year_display": "2023/2024",
    "price": 145000,
    "price_old": 159000,
    "mileage": 12500,
    "fuel_type": "flex",
    "transmission": "automatico",
    "color": "prata",
    "body_type": "sedan",
    "condition": "seminovo",
    "status": "disponivel",
    "featured": true,
    "images": ["https://.../foto1.jpg", "..."],
    "features": ["Ar-condicionado digital", "Multimídia"]
  },
  "form": {
    "name": "João da Silva",
    "phone": "+5511999999999",
    "email": "joao@exemplo.com",
    "message": "Tenho interesse, podemos conversar?"
  }
}`;

const SELL_PAYLOAD_EXAMPLE = `{
  "type": "sell_lead",
  "sent_at": "2026-05-06T14:30:00.000Z",
  "store": {
    "name": "Sua Loja",
    "whatsapp": "5511999999999",
    "phone": "1133334444"
  },
  "proposal": {
    "id": "xyz789",
    "url": "https://seusite.com/admin/propostas?id=xyz789",
    "status": "novo",
    "created_date": "2026-05-06T14:29:50.000Z"
  },
  "owner": {
    "name": "Maria Souza",
    "email": "maria@exemplo.com",
    "phone": "+5511988887777",
    "city": "São Paulo"
  },
  "vehicle": {
    "brand": "Honda",
    "model": "Civic",
    "version": "EXL 2.0",
    "year": 2022,
    "manufacture_year": 2021,
    "year_display": "2021/2022",
    "mileage": 35000,
    "fuel_type": "flex",
    "transmission": "automatico",
    "color": "preto",
    "condition_notes": "Único dono, todas as revisões em concessionária.",
    "asking_price": 110000,
    "images": ["https://.../foto1.jpg", "..."]
  }
}`;

export default function SettingsWebhooks({ form, update }) {
  return (
    <Section
      title="Webhooks & Automações"
      desc="Conecte sua loja a ferramentas externas (CRM, Zapier, Make, n8n, etc.). Quando ativados, eventos do site são enviados em tempo real para o endereço configurado. Você pode deixar tudo desativado e o site continua funcionando normalmente."
      icon={Webhook}
    >
      <div className="space-y-5">
        <WebhookCard
          form={form}
          update={update}
          title="Webhook · Tenho interesse"
          description="Quando ativo, o botão 'Tenho interesse' abre um formulário customizável (configurável na aba 'Formulário') em vez de ir direto para o WhatsApp. Os dados do veículo + o link direto da página + os dados do formulário são enviados ao seu webhook."
          enabledKey="interest_webhook_enabled"
          urlKey="interest_webhook_url"
          authEnabledKey="interest_webhook_auth_enabled"
          authUserKey="interest_webhook_auth_user"
          authPassKey="interest_webhook_auth_pass"
          kind="interest"
          payloadHint={INTEREST_PAYLOAD_EXAMPLE}
        />

        <WebhookCard
          form={form}
          update={update}
          title="Webhook · Vender meu veículo"
          description="Disparado automaticamente sempre que uma nova proposta de venda é cadastrada no site. O payload inclui todos os dados informados e um link direto para a proposta no admin."
          enabledKey="sell_webhook_enabled"
          urlKey="sell_webhook_url"
          authEnabledKey="sell_webhook_auth_enabled"
          authUserKey="sell_webhook_auth_user"
          authPassKey="sell_webhook_auth_pass"
          kind="sell"
          payloadHint={SELL_PAYLOAD_EXAMPLE}
        />
      </div>
    </Section>
  );
}

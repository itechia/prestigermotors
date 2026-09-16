'use client';

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Smartphone,
  Monitor,
  Send,
  AlertTriangle,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import StatTile from "@/components/admin/StatTile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/adminApi";
import { getExistingSubscription, subscribeToPush } from "@/lib/pushClient";

const MAX_BODY = 300;
const QUERY_KEY = ["admin", "push"];

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Reproduz o formato do Android: logo à esquerda, nome da loja em destaque e
// a mensagem embaixo. Serve para o dono conferir antes de disparar.
function NotificationPreview({ storeName, logoUrl, message }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
        Como vai aparecer no celular
      </div>
      <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-3 shadow-sm">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-contain bg-background flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{storeName}</div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
            {message || "Escreva a mensagem ao lado para ver o resultado aqui."}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        O nome e a logo vêm de Configurações. Abaixo da mensagem o navegador ainda
        mostra o endereço do site — isso some quando o visitante instala o site na
        tela de início.
      </p>
    </div>
  );
}

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("/");

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch("/api/admin/push"),
  });

  const storeName = data?.store?.name || "Prestiger Motors";
  const logoUrl = data?.store?.logoUrl || "";
  const configured = data?.configured !== false;
  const total = data?.total ?? 0;

  const sendMutation = useMutation({
    mutationFn: (payload) =>
      adminFetch("/api/admin/push/send", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (result, variables) => {
      if (variables.test_endpoint) {
        toast.success("Teste enviado para este navegador.");
        return;
      }
      toast.success(`Enviado para ${result.sent} de ${result.sent + result.failed} aparelhos.`);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Escreva a mensagem da notificação.");
      return;
    }
    sendMutation.mutate({ body: message.trim(), url: url.trim() || "/" });
  };

  // O teste exige que o navegador do admin esteja inscrito. Se ainda não
  // estiver, inscreve na hora — é um clique a menos e evita esbarrar no erro
  // "este navegador não está inscrito".
  const handleTest = async () => {
    if (!message.trim()) {
      toast.error("Escreva a mensagem da notificação.");
      return;
    }
    try {
      let subscription = await getExistingSubscription();
      if (!subscription) subscription = await subscribeToPush();
      sendMutation.mutate({
        body: message.trim(),
        url: url.trim() || "/",
        test_endpoint: subscription.endpoint,
      });
    } catch (error) {
      toast.error(error?.message || "Não foi possível inscrever este navegador.");
    }
  };

  const busy = sendMutation.isPending;

  return (
    <AdminShell
      title="Notificações"
      subtitle="Envie promoções direto para o celular de quem aceitou receber. Sem cadastro, sem lista de e-mail."
    >
      {!configured && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs md:text-sm leading-relaxed">
            As chaves de envio (VAPID) ainda não foram configuradas na Vercel. Enquanto
            isso, o convite não aparece no site e nenhum envio sai daqui.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile icon={Bell} label="Aparelhos inscritos" value={total} loading={isLoading} />
        <StatTile icon={Smartphone} label="Celular" value={data?.byDevice?.mobile ?? 0} loading={isLoading} />
        <StatTile icon={Smartphone} label="Tablet" value={data?.byDevice?.tablet ?? 0} loading={isLoading} />
        <StatTile icon={Monitor} label="Computador" value={data?.byDevice?.desktop ?? 0} loading={isLoading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg">Nova notificação</h2>
            <p className="text-xs text-muted-foreground">
              O título é sempre o nome da loja. Escreva só a mensagem.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-body" className="text-xs">Mensagem</Label>
            <Textarea
              id="push-body"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, MAX_BODY))}
              rows={4}
              placeholder="Dia de promoção! Receba R$ 1.000,00 de desconto na compra de um novo veículo."
            />
            <div className="text-[11px] text-muted-foreground text-right">
              {message.length}/{MAX_BODY}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-url" className="text-xs">Abrir ao tocar</Label>
            <Input
              id="push-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="/"
            />
            <p className="text-[11px] text-muted-foreground">
              Caminho do próprio site. Ex.: <code>/</code> para a home ou{" "}
              <code>/veiculo/civic-2020</code> para um veículo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              onClick={handleSend}
              disabled={busy || !configured || total === 0}
              className="rounded-full h-10 px-5 flex-1"
            >
              <Send className="w-4 h-4 mr-2" aria-hidden="true" />
              {busy ? "Enviando..." : `Enviar para ${total} aparelho${total === 1 ? "" : "s"}`}
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={busy || !configured}
              className="rounded-full h-10 px-4"
            >
              <BellRing className="w-4 h-4 mr-2" aria-hidden="true" />
              Testar aqui
            </Button>
          </div>

          {total === 0 && configured && (
            <p className="text-[11px] text-muted-foreground">
              Ninguém se inscreveu ainda. Use &quot;Testar aqui&quot; para inscrever este
              navegador e ver como fica.
            </p>
          )}
        </div>

        <NotificationPreview storeName={storeName} logoUrl={logoUrl} message={message} />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-5">
        <h2 className="font-display font-bold text-lg mb-1">Envios anteriores</h2>
        <p className="text-xs text-muted-foreground mb-4">Últimos 20 disparos.</p>

        {(data?.campaigns || []).length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Nenhuma notificação enviada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {data.campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-xl border border-border/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{campaign.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDateTime(campaign.created_at)}
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground flex-shrink-0 tabular-nums">
                  {campaign.sent_count} entregue{campaign.sent_count === 1 ? "" : "s"}
                  {campaign.failed_count > 0 && ` · ${campaign.failed_count} falha(s)`}
                  {campaign.expired_count > 0 && ` · ${campaign.expired_count} removida(s)`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

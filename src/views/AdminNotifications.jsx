'use client';

import React, { useMemo, useState } from "react";
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
import SearchableSelect from "@/components/admin/SearchableSelect";
import { adminFetch } from "@/lib/adminApi";
import { getExistingSubscription, subscribeToPush } from "@/lib/pushClient";
import { useTaxonomies, slugify } from "@/lib/useTaxonomies";
import { buildCatalogPath } from "@/lib/catalogFilterParams";
import { fetchVehiclesAdmin, VEHICLES_ADMIN_QUERY_KEY, FIVE_MIN } from "@/lib/vehicleQueries";

const MAX_TITLE = 60;
const MAX_BODY = 300;
const QUERY_KEY = ["admin", "push"];

const DESTINOS = [
  { id: "loja", label: "A loja toda" },
  { id: "grupo", label: "Um grupo de veículos" },
  { id: "veiculo", label: "Um veículo" },
];

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

function nomeDoVeiculo(vehicle) {
  const nome = [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
  const ano = vehicle.manufacture_year || vehicle.year;
  return ano ? `${nome} (${ano})` : nome;
}

// Espelha a notificação real: logo da loja, título em destaque e a mensagem
// embaixo. O iPhone acrescenta sozinho uma linha com o nome da loja, por isso
// ela aparece aqui em cinza: é o que o dono vai ver no aparelho.
function NotificationPreview({ storeName, logoUrl, title, message }) {
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
          <div className="font-semibold text-sm break-words">
            {title || "Título da notificação"}
          </div>
          <div className="text-[11px] text-muted-foreground">{storeName}</div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1 whitespace-pre-wrap break-words">
            {message || "A mensagem aparece aqui."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [destino, setDestino] = useState("loja");
  const [linkTipo, setLinkTipo] = useState("");
  const [linkMarca, setLinkMarca] = useState("");
  const [linkModelo, setLinkModelo] = useState("");
  const [linkVeiculo, setLinkVeiculo] = useState("");

  const taxonomies = useTaxonomies();

  const { data: vehicles = [] } = useQuery({
    queryKey: VEHICLES_ADMIN_QUERY_KEY,
    queryFn: fetchVehiclesAdmin,
    staleTime: FIVE_MIN,
  });

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch("/api/admin/push"),
  });

  const storeName = data?.store?.name || "Prestiger Motors";
  const logoUrl = data?.store?.logoUrl || "";
  const configured = data?.configured !== false;
  const total = data?.total ?? 0;

  const visiveis = useMemo(
    () => vehicles.filter((vehicle) => !vehicle.hidden && vehicle.slug),
    [vehicles]
  );

  const modelOptions = useMemo(() => {
    const marcaSlug = slugify(linkMarca);
    return (taxonomies.models || [])
      .filter((model) => !marcaSlug || !model.parent || model.parent === marcaSlug)
      .map((model) => ({ label: model.label, value: model.label }));
  }, [taxonomies.models, linkMarca]);

  const vehicleOptions = useMemo(
    () => visiveis.map((vehicle) => ({ label: nomeDoVeiculo(vehicle), value: vehicle.slug })),
    [visiveis]
  );

  // Quantos veículos o grupo escolhido alcança hoje. Evita disparar uma
  // promoção que leva o cliente para uma lista vazia.
  const alcanceDoGrupo = useMemo(() => {
    if (!linkTipo && !linkMarca && !linkModelo) return null;
    return visiveis.filter((vehicle) => {
      if (linkTipo && (vehicle.vehicle_type || "") !== linkTipo) return false;
      if (linkMarca && (vehicle.brand || "").toLowerCase() !== linkMarca.toLowerCase()) {
        return false;
      }
      if (linkModelo && slugify(vehicle.model) !== slugify(linkModelo)) return false;
      return true;
    }).length;
  }, [visiveis, linkTipo, linkMarca, linkModelo]);

  // O endereço é sempre derivado da escolha, nunca digitado.
  const url = useMemo(() => {
    if (destino === "veiculo") return linkVeiculo ? `/veiculo/${linkVeiculo}` : "/";
    if (destino === "grupo") {
      return buildCatalogPath({ tipo: linkTipo, marca: linkMarca, modelo: linkModelo });
    }
    return "/";
  }, [destino, linkVeiculo, linkTipo, linkMarca, linkModelo]);

  const limparDestino = () => {
    setDestino("loja");
    setLinkTipo("");
    setLinkMarca("");
    setLinkModelo("");
    setLinkVeiculo("");
  };

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
      setTitle("");
      setMessage("");
      limparDestino();
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => toast.error(error.message),
  });

  // Título e mensagem são exigidos nos dois caminhos (envio e teste).
  const validate = () => {
    if (!title.trim()) {
      toast.error("Escreva o título da notificação.");
      return false;
    }
    if (!message.trim()) {
      toast.error("Escreva a mensagem da notificação.");
      return false;
    }
    if (destino === "veiculo" && !linkVeiculo) {
      toast.error("Escolha o veículo que a notificação vai abrir.");
      return false;
    }
    return true;
  };

  const handleSend = () => {
    if (!validate()) return;
    sendMutation.mutate({ title: title.trim(), body: message.trim(), url });
  };

  // O teste exige que o navegador do admin esteja inscrito. Se ainda não
  // estiver, inscreve na hora: é um clique a menos e evita esbarrar no erro
  // "este navegador não está inscrito".
  const handleTest = async () => {
    if (!validate()) return;
    try {
      let subscription = await getExistingSubscription();
      if (!subscription) subscription = await subscribeToPush();
      sendMutation.mutate({
        title: title.trim(),
        body: message.trim(),
        url,
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
      subtitle="Envie promoções direto para o celular de quem aceitou receber."
    >
      {!configured && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs md:text-sm leading-relaxed">
            O envio de notificações ainda não está ativo. Fale com o suporte técnico.
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
              Evite repetir o nome da loja. Ele já aparece sozinho.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-title" className="text-xs">Título</Label>
            <Input
              id="push-title"
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, MAX_TITLE))}
              placeholder="Dia de promoção"
            />
            <div className="text-[11px] text-muted-foreground text-right">
              {title.length}/{MAX_TITLE}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-body" className="text-xs">Mensagem</Label>
            <Textarea
              id="push-body"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, MAX_BODY))}
              rows={4}
              placeholder="Toyota Corolla Cross com R$ 15.010,00 de desconto"
            />
            <div className="text-[11px] text-muted-foreground text-right">
              {message.length}/{MAX_BODY}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Ao tocar, abrir</Label>

            <div className="flex flex-wrap gap-2">
              {DESTINOS.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  onClick={() => setDestino(opcao.id)}
                  className={`h-9 px-4 rounded-full text-xs font-semibold transition-colors border ${
                    destino === opcao.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opcao.label}
                </button>
              ))}
            </div>

            {destino === "grupo" && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <SearchableSelect
                    value={linkTipo}
                    onChange={setLinkTipo}
                    options={(taxonomies.vehicle_types || []).map((item) => ({
                      label: item.label,
                      value: item.label,
                    }))}
                    placeholder="Tipo"
                  />
                  <SearchableSelect
                    value={linkMarca}
                    // Trocar de marca zera o modelo: um XRE 300 não faz sentido
                    // pendurado na Fiat.
                    onChange={(value) => {
                      setLinkMarca(value);
                      setLinkModelo("");
                    }}
                    options={(taxonomies.brands || []).map((item) => ({
                      label: item.label,
                      value: item.label,
                    }))}
                    placeholder="Marca"
                  />
                  <SearchableSelect
                    value={linkModelo}
                    onChange={setLinkModelo}
                    options={modelOptions}
                    placeholder="Modelo"
                  />
                </div>

                {alcanceDoGrupo === null ? (
                  <p className="text-[11px] text-muted-foreground">
                    Escolha ao menos um item acima.
                  </p>
                ) : alcanceDoGrupo === 0 ? (
                  <p className="text-[11px] text-amber-600 dark:text-amber-500">
                    Nenhum veículo do estoque combina com essa escolha.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {alcanceDoGrupo} veículo{alcanceDoGrupo === 1 ? "" : "s"} do estoque
                    {alcanceDoGrupo === 1 ? " combina" : " combinam"} com essa escolha.
                  </p>
                )}
              </div>
            )}

            {destino === "veiculo" && (
              <div className="pt-1">
                <SearchableSelect
                  value={linkVeiculo}
                  onChange={setLinkVeiculo}
                  options={vehicleOptions}
                  placeholder="Escolha o veículo"
                />
              </div>
            )}
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
              Ninguém se inscreveu ainda. Use &quot;Testar aqui&quot; para ver como fica no
              seu aparelho.
            </p>
          )}
        </div>

        <NotificationPreview
          storeName={storeName}
          logoUrl={logoUrl}
          title={title}
          message={message}
        />
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
                  <p className="text-sm font-medium truncate">{campaign.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{campaign.body}</p>
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

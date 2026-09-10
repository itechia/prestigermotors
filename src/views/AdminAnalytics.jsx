'use client';

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  MousePointerClick,
  Users,
  Timer,
  MessageCircle,
  Share2,
  Search,
  TrendingDown,
  Smartphone,
  ExternalLink,
  RefreshCw,
  CalendarRange,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import StatTile from "@/components/admin/StatTile";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/adminApi";

const PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
  { days: 365, label: "12 meses" },
];

// O <input type="date"> devolve "AAAA-MM-DD". Montamos o instante no fuso do
// próprio navegador para que "01/09" comece à meia-noite daqui, e não em UTC.
function startOfDayIso(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function endOfDayIso(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function toInputDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatRangeLabel(from, to) {
  if (!from || !to) return "";
  const options = { day: "2-digit", month: "short", year: "numeric" };
  const start = new Date(from).toLocaleDateString("pt-BR", options);
  const end = new Date(to).toLocaleDateString("pt-BR", options);
  return start === end ? start : `${start} a ${end}`;
}

// Origens conhecidas ganham nome próprio; o resto aparece como veio.
const ORIGIN_LABELS = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  buscador: "Buscadores",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  direto: "Acesso direto",
};

const DEVICE_LABELS = {
  mobile: "Celular",
  tablet: "Tablet",
  desktop: "Computador",
  desconhecido: "Não identificado",
};

function formatDuration(ms) {
  const total = Math.round((Number(ms) || 0) / 1000);
  if (total <= 0) return "—";
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes < 60) return seconds ? `${minutes}min ${seconds}s` : `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}

function percent(part, total) {
  if (!total) return "0%";
  return `${Math.round((Number(part) / Number(total)) * 100)}%`;
}

function formatDay(iso) {
  const [, month, day] = String(iso).split("-");
  return `${day}/${month}`;
}

export default function AdminAnalytics() {
  const today = toInputDate(new Date());
  // "range" é o período de fato aplicado; o rascunho só vira consulta ao clicar
  // em Aplicar, para não disparar uma busca a cada tecla no campo de data.
  const [range, setRange] = useState({ days: 30 });
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    from: toInputDate(Date.now() - 29 * 24 * 60 * 60 * 1000),
    to: toInputDate(new Date()),
  }));

  const queryString = range.days
    ? `days=${range.days}`
    : `from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-analytics", queryString],
    queryFn: () => adminFetch(`/api/admin/analytics?${queryString}`),
    staleTime: 60 * 1000,
  });

  const draftInvalid = !draft.from || !draft.to || draft.from > draft.to;

  const applyCustomRange = () => {
    if (draftInvalid) return;
    setRange({ from: startOfDayIso(draft.from), to: endOfDayIso(draft.to) });
  };

  const analytics = data?.analytics || null;
  const summary = analytics?.summary || {};
  const byDay = analytics?.by_day || [];
  const topVehicles = analytics?.top_vehicles || [];
  const topPages = analytics?.top_pages || [];
  const topSearches = analytics?.top_searches || [];
  const topFilters = analytics?.top_filters || [];
  const devices = analytics?.devices || [];
  const referrers = analytics?.referrers || [];

  const maxDay = useMemo(
    () => Math.max(1, ...byDay.map((d) => Number(d.sessions) || 0)),
    [byDay]
  );

  const appliedLabel = formatRangeLabel(data?.from, data?.to);
  const hasData = (Number(summary.sessions) || 0) > 0;

  return (
    <AdminShell
      title="Analítico do site"
      subtitle="Como os visitantes navegam pelo catálogo e onde o interesse acontece."
      actions={
        <Button
          variant="outline"
          className="rounded-full h-10 px-4"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      }
    >
      {/* Período */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.days}
              type="button"
              onClick={() => {
                setCustomOpen(false);
                setRange({ days: period.days });
              }}
              className={`h-9 px-4 rounded-full text-xs font-semibold transition-colors border ${
                range.days === period.days
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {period.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCustomOpen((open) => !open)}
            aria-expanded={customOpen}
            className={`h-9 px-4 rounded-full text-xs font-semibold transition-colors border inline-flex items-center gap-1.5 ${
              !range.days
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" aria-hidden="true" />
            Personalizado
          </button>

          <span className="text-xs text-muted-foreground sm:ml-auto">
            Só conta visitantes que aceitaram os cookies.
          </span>
        </div>

        {customOpen && (
          <div className="mt-3 bg-card border border-border/50 rounded-2xl p-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="analitico-de" className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                De
              </label>
              <input
                id="analitico-de"
                type="date"
                value={draft.from}
                max={draft.to || today}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm dark:[color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="analitico-ate" className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Até
              </label>
              <input
                id="analitico-ate"
                type="date"
                value={draft.to}
                min={draft.from}
                max={today}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm dark:[color-scheme:dark]"
              />
            </div>

            <Button
              type="button"
              onClick={applyCustomRange}
              disabled={draftInvalid}
              className="h-10 rounded-full px-5 font-semibold"
            >
              Aplicar
            </Button>

            {draftInvalid && (
              <p role="alert" className="text-xs text-destructive basis-full">
                Escolha uma data inicial igual ou anterior à data final.
              </p>
            )}
          </div>
        )}

        {appliedLabel && (
          <p className="text-xs text-muted-foreground mt-2">
            Exibindo {appliedLabel}.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-destructive/5 border border-destructive/30 text-destructive rounded-2xl p-4 text-sm mb-6">
          {error.message || "Não foi possível carregar o analítico."}
        </div>
      )}

      {!isLoading && !hasData && !error && (
        <div className="bg-card border border-border/50 rounded-2xl p-8 text-center mb-6">
          <h2 className="font-display font-bold text-lg">Ainda não há dados neste período</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Os números aparecem assim que os visitantes navegarem pelo site e aceitarem
            o aviso de cookies. Em períodos curtos é normal começar zerado.
          </p>
        </div>
      )}

      {/* Visão geral */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        <StatTile icon={Users} label="Visitantes" value={summary.visitors ?? 0} loading={isLoading} />
        <StatTile icon={Eye} label="Sessões" value={summary.sessions ?? 0} loading={isLoading} />
        <StatTile icon={Eye} label="Veículos vistos" value={summary.vehicle_views ?? 0} loading={isLoading} />
        <StatTile icon={MousePointerClick} label="Tenho interesse" value={summary.interest_clicks ?? 0} loading={isLoading} />
        <StatTile icon={MessageCircle} label="Cliques no WhatsApp" value={summary.whatsapp_clicks ?? 0} loading={isLoading} />
        <StatTile icon={Timer} label="Tempo médio no veículo" value={formatDuration(summary.avg_vehicle_time_ms)} loading={isLoading} compact />
      </div>

      {/* Funil de interesse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-display font-bold text-lg mb-1">Funil de interesse</h2>
          <p className="text-xs text-muted-foreground mb-5">
            De cada 100 pessoas que abrem um veículo, quantas chamam a loja.
          </p>

          <div className="space-y-3">
            <FunnelRow
              label="Sessões que abriram algum veículo"
              value={summary.sessions_with_vehicle ?? 0}
              total={summary.sessions ?? 0}
            />
            <FunnelRow
              label="Sessões que demonstraram interesse"
              value={summary.sessions_with_interest ?? 0}
              total={summary.sessions_with_vehicle ?? 0}
              tone="positive"
            />
            <FunnelRow
              label="Saíram sem clicar em interesse"
              value={summary.sessions_without_interest ?? 0}
              total={summary.sessions_with_vehicle ?? 0}
              tone="negative"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/50">
            <MiniStat
              icon={TrendingDown}
              label="Taxa de saída sem interesse"
              value={percent(summary.sessions_without_interest, summary.sessions_with_vehicle)}
            />
            <MiniStat
              icon={MousePointerClick}
              label="Conversão em interesse"
              value={percent(summary.sessions_with_interest, summary.sessions_with_vehicle)}
            />
            <MiniStat icon={Share2} label="Compartilhamentos" value={summary.shares ?? 0} />
            <MiniStat icon={Search} label="Buscas feitas" value={summary.searches ?? 0} />
          </div>
        </div>

        {/* Sessões por dia */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="font-display font-bold text-lg mb-1">Movimento por dia</h2>
          <p className="text-xs text-muted-foreground mb-4">Sessões e cliques em interesse.</p>

          {byDay.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem movimento registrado.</p>
          ) : (
            <div className="flex items-end gap-1 h-40" role="img" aria-label="Sessões por dia">
              {byDay.slice(-30).map((day) => {
                const height = Math.max(4, ((Number(day.sessions) || 0) / maxDay) * 100);
                return (
                  <div key={day.dia} className="flex-1 flex flex-col justify-end group relative">
                    <div
                      className="w-full rounded-t bg-primary/70 group-hover:bg-primary transition-colors"
                      style={{ height: `${height}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap text-[10px] bg-popover border border-border rounded px-1.5 py-0.5 shadow">
                      {formatDay(day.dia)}: {day.sessions} sessões · {day.interest_clicks} interesses
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Veículos mais acessados */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-border/50">
          <h2 className="font-display font-bold text-lg">Veículos mais acessados</h2>
          <p className="text-xs text-muted-foreground">
            Ordenados por visualizações. &quot;Interesse&quot; soma cliques no botão e no WhatsApp.
          </p>
        </div>

        {topVehicles.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">
            Nenhum veículo visitado no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-medium">Veículo</th>
                  <th className="px-3 py-3 font-medium text-right">Visitas</th>
                  <th className="px-3 py-3 font-medium text-right">Pessoas</th>
                  <th className="px-3 py-3 font-medium text-right">Interesse</th>
                  <th className="px-3 py-3 font-medium text-right">Conversão</th>
                  <th className="px-3 py-3 font-medium text-right">Tempo médio</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {topVehicles.map((row) => {
                  const interest =
                    (Number(row.interest_clicks) || 0) + (Number(row.whatsapp_clicks) || 0);
                  return (
                    <tr key={row.vehicle_id} className="border-b border-border/40 last:border-0">
                      <td className="px-5 py-3">
                        <span className="font-medium">{row.label}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.views}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {row.sessions}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{interest}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span
                          className={
                            interest === 0 && Number(row.sessions) >= 5
                              ? "text-destructive font-medium"
                              : ""
                          }
                        >
                          {percent(interest, row.sessions)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {formatDuration(row.avg_time_ms)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {row.slug && (
                          <Link
                            href={`/veiculo/${row.slug}`}
                            target="_blank"
                            className="text-muted-foreground hover:text-foreground inline-flex"
                            title="Abrir no site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Listas auxiliares */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <RankCard
          title="O que buscam"
          subtitle="Termos digitados na busca"
          rows={topSearches.map((s) => ({ label: s.term, value: s.total }))}
          empty="Nenhuma busca registrada."
        />
        <RankCard
          title="Filtros mais usados"
          subtitle="Marca, categoria, câmbio…"
          rows={topFilters.map((f) => ({ label: `${f.field}: ${f.value}`, value: f.total }))}
          empty="Nenhum filtro aplicado."
        />
        <RankCard
          title="Páginas mais vistas"
          subtitle="Endereços abertos no site"
          rows={topPages.map((p) => ({ label: p.path, value: p.views }))}
          empty="Sem páginas registradas."
        />
        <RankCard
          title="De onde vêm"
          subtitle="Origem do acesso"
          rows={referrers.map((r) => ({ label: ORIGIN_LABELS[r.origem] || r.origem, value: r.sessions }))}
          empty="Sem origem identificada."
        />
      </div>

      {/* Dispositivos */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 mt-4">
        <h2 className="font-display font-bold text-lg mb-1">Dispositivos</h2>
        <p className="text-xs text-muted-foreground mb-4">Sessões por tipo de tela.</p>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {devices.map((d) => (
              <MiniStat
                key={d.device}
                icon={Smartphone}
                label={DEVICE_LABELS[d.device] || d.device}
                value={`${d.sessions} (${percent(d.sessions, summary.sessions)})`}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-6">
        Os dados são anônimos: guardamos apenas identificadores aleatórios gerados no
        navegador, sem nome, telefone ou e-mail. O histórico é mantido por 400 dias.
      </p>
    </AdminShell>
  );
}

function FunnelRow({ label, value, total, tone }) {
  const width = total ? Math.min(100, (Number(value) / Number(total)) * 100) : 0;
  const barColor =
    tone === "negative" ? "bg-destructive/60" : tone === "positive" ? "bg-green-500/70" : "bg-primary/60";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {value}
          <span className="text-xs text-muted-foreground font-normal ml-1.5">
            {percent(value, total)}
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="font-display font-bold text-lg mt-0.5">{value}</div>
    </div>
  );
}

function RankCard({ title, subtitle, rows, empty }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5">
      <h2 className="font-display font-bold text-base">{title}</h2>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.slice(0, 8).map((row, i) => (
            <li key={`${row.label}-${i}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate" title={row.label}>{row.label}</span>
                <span className="tabular-nums font-medium">{row.value}</span>
              </div>
              <div className="h-1 rounded-full bg-secondary mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50"
                  style={{ width: `${((Number(row.value) || 0) / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

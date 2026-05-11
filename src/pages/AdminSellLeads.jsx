import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Phone, Mail, MapPin, Car, Gauge, Calendar, DollarSign,
  Trash2, MessageCircle, ChevronRight, Inbox, Search, CheckCircle2, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AdminShell from "../components/admin/AdminShell";
import { formatCurrency, formatMileage } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  novo: "Novo",
  em_analise: "Em análise",
  contatado: "Contatado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const STATUS_COLORS = {
  novo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  em_analise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  contatado: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  aprovado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  recusado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminSellLeads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["sellLeads"],
    queryFn: () => base44.entities.SellLead.list("-created_date", 200),
  });

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.owner_name} ${l.owner_phone} ${l.brand} ${l.model}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const counts = useMemo(() => {
    const c = { all: leads.length, novo: 0, em_analise: 0, contatado: 0, aprovado: 0, recusado: 0 };
    leads.forEach((l) => { c[l.status || "novo"] = (c[l.status || "novo"] || 0) + 1; });
    return c;
  }, [leads]);

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SellLead.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sellLeads"] });
      if (selected && data) setSelected({ ...selected, ...data });
      toast.success("Proposta atualizada");
    },
  });

  const removeMut = useMutation({
    mutationFn: (id) => base44.entities.SellLead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellLeads"] });
      setSelected(null);
      toast.success("Proposta removida");
    },
  });

  return (
    <AdminShell
      title="Propostas de venda"
      subtitle="Pessoas que querem vender o carro delas para a loja."
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
        <StatusChip label="Todas" count={counts.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <StatusChip
            key={key}
            label={label}
            count={counts[key] || 0}
            active={statusFilter === key}
            onClick={() => setStatusFilter(key)}
            color={STATUS_COLORS[key]}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone, marca ou modelo..."
          className="pl-11 h-11 rounded-full bg-secondary border-0"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border/50 p-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg">Nenhuma proposta {statusFilter !== "all" ? `com status "${STATUS_LABELS[statusFilter]}"` : "ainda"}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Quando alguém enviar o veículo dela pelo site, aparece aqui.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border/50 overflow-hidden divide-y divide-border/50">
          {filtered.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelected(lead)}
              className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                {lead.images?.[0] ? (
                  <img src={lead.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">
                    {lead.brand} {lead.model} {lead.year ? `· ${lead.year}` : ""}
                  </h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    STATUS_COLORS[lead.status || "novo"]
                  )}>
                    {STATUS_LABELS[lead.status || "novo"]}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {lead.owner_name} · {lead.owner_phone}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {lead.created_date && format(new Date(lead.created_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                </div>
              </div>
              <div className="hidden sm:block text-right">
                {lead.asking_price > 0 && (
                  <div className="font-display font-bold text-sm">{formatCurrency(lead.asking_price)}</div>
                )}
                <div className="text-[10px] text-muted-foreground">Pedido</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <LeadDetailDialog
        lead={selected}
        onClose={() => setSelected(null)}
        onUpdate={(data) => updateMut.mutate({ id: selected.id, data })}
        onRemove={() => {
          if (confirm("Remover esta proposta definitivamente?")) {
            removeMut.mutate(selected.id);
          }
        }}
      />
    </AdminShell>
  );
}

function StatusChip({ label, count, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl p-3 text-left border transition-all",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border/50 hover:border-border"
      )}
    >
      <div className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</div>
      <div className="font-display font-bold text-xl mt-0.5">{count}</div>
    </button>
  );
}

function LeadDetailDialog({ lead, onClose, onUpdate, onRemove }) {
  if (!lead) return null;

  const whatsappLink = lead.owner_phone
    ? `https://wa.me/${String(lead.owner_phone).replace(/\D/g, "")}`
    : null;

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {lead.brand} {lead.model} {lead.year ? `· ${lead.year}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
              STATUS_COLORS[lead.status || "novo"]
            )}>
              {STATUS_LABELS[lead.status || "novo"]}
            </span>
            {lead.created_date && (
              <span className="text-xs text-muted-foreground">
                Recebida em {format(new Date(lead.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Owner */}
          <SectionBlock title="Proprietário">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoLine icon={CheckCircle2} label="Nome" value={lead.owner_name} />
              <InfoLine icon={Phone} label="Telefone" value={lead.owner_phone} />
              <InfoLine icon={Mail} label="E-mail" value={lead.owner_email} />
              <InfoLine icon={MapPin} label="Cidade" value={lead.owner_city} />
            </div>
            {whatsappLink && (
              <Button asChild variant="outline" className="mt-3 rounded-full" size="sm">
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" /> Abrir WhatsApp
                </a>
              </Button>
            )}
          </SectionBlock>

          {/* Vehicle */}
          <SectionBlock title="Veículo">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <InfoLine icon={Car} label="Marca/Modelo" value={`${lead.brand} ${lead.model}`} />
              <InfoLine icon={Calendar} label="Ano" value={`${lead.manufacture_year || "-"} / ${lead.year || "-"}`} />
              <InfoLine icon={Gauge} label="Quilometragem" value={lead.mileage ? formatMileage(lead.mileage) : "-"} />
              <InfoLine label="Versão" value={lead.version} />
              <InfoLine label="Cor" value={lead.color} />
              <InfoLine label="Combustível" value={lead.fuel_type} />
              <InfoLine label="Câmbio" value={lead.transmission} />
              <InfoLine
                icon={DollarSign}
                label="Valor pedido"
                value={lead.asking_price > 0 ? formatCurrency(lead.asking_price) : "Não informado"}
              />
            </div>
            {lead.condition_notes && (
              <div className="mt-3 p-3 bg-secondary/50 rounded-xl">
                <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1">
                  Observações
                </div>
                <p className="text-sm whitespace-pre-line">{lead.condition_notes}</p>
              </div>
            )}
          </SectionBlock>

          {/* Photos */}
          {lead.images?.length > 0 && (
            <SectionBlock title={`Fotos (${lead.images.length})`}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {lead.images.map((img, i) => (
                  <a
                    key={i}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-secondary"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </SectionBlock>
          )}

          {/* Admin controls */}
          <SectionBlock title="Status e anotações internas">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={lead.status || "novo"}
                  onValueChange={(v) => onUpdate({ status: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Anotações (somente admin)</Label>
                <Textarea
                  defaultValue={lead.admin_notes || ""}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== (lead.admin_notes || "")) onUpdate({ admin_notes: v });
                  }}
                  rows={3}
                  className="mt-1"
                  placeholder="Avaliação, valor proposto pela loja, próximos passos..."
                />
              </div>
            </div>
          </SectionBlock>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-full flex-1">
              <X className="w-4 h-4 mr-2" /> Fechar
            </Button>
            <Button
              variant="outline"
              onClick={onRemove}
              className="rounded-full text-destructive border-destructive/30 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remover proposta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div>
      <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />}
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
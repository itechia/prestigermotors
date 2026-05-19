'use client';

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { fetchVehiclesAdmin, VEHICLES_ADMIN_QUERY_KEY } from "@/lib/vehicleQueries";
import { Plus, Car, Eye, CheckCircle2, DollarSign, Flame, ArrowRight, Settings, Inbox, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import AdminShell from "../components/admin/AdminShell";
import { useAuth } from "@/lib/AuthContext";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: VEHICLES_ADMIN_QUERY_KEY,
    queryFn: fetchVehiclesAdmin,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["sellLeads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sell_leads")
        .select("id,status,created_date")
        .order("created_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const newLeads = leads.filter((l) => (l.status || "novo") === "novo").length;
  const available = vehicles.filter((v) => v.status === "disponivel");
  const reserved = vehicles.filter((v) => v.status === "reservado");
  const sold = vehicles.filter((v) => v.status === "vendido");
  const featured = vehicles.filter((v) => v.featured);
  const totalValue = available.reduce((sum, v) => sum + (v.price || 0) * (v.stock_quantity || 1), 0);
  const recent = vehicles.slice(0, 5);

  return (
    <AdminShell
      title="Visão geral"
      subtitle="Acompanhe estoque, vendas e operação administrativa."
      actions={isAdmin ? (
        <Button asChild className="rounded-full h-10 px-5 font-semibold">
          <Link href="/admin/veiculo/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo veículo
          </Link>
        </Button>
      ) : null}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard icon={Car} label="Total cadastrado" value={vehicles.length} loading={isLoading} />
        <StatCard icon={Eye} label="Disponíveis" value={available.length} loading={isLoading} accent="green" />
        <StatCard icon={Flame} label="Em destaque" value={featured.length} loading={isLoading} accent="amber" />
        <StatCard icon={DollarSign} label="Valor em estoque" value={formatCurrency(totalValue)} loading={isLoading} small />
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <StatCard icon={CheckCircle2} label="Reservados" value={reserved.length} loading={isLoading} small accent="yellow" />
        <StatCard icon={CheckCircle2} label="Vendidos" value={sold.length} loading={isLoading} small accent="red" />
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-8">
        <QuickAction
          href="/admin/veiculos"
          icon={Car}
          title="Estoque e catálogo"
          desc={isAdmin ? "Adicionar, editar ou remover veículos" : "Consultar disponibilidade dos veículos"}
        />
        <QuickAction
          href="/admin/vendas"
          icon={ReceiptText}
          title="Registrar vendas"
          desc="Baixa de estoque e histórico comercial"
        />
        <QuickAction
          href="/admin/propostas"
          icon={Inbox}
          title={`Propostas de venda${newLeads > 0 ? ` (${newLeads} nova${newLeads > 1 ? "s" : ""})` : ""}`}
          desc="Clientes querendo vender para a loja"
          badge={newLeads}
        />
        {isAdmin && (
          <QuickAction
            href="/admin/configuracoes"
            icon={Settings}
            title="Configurações"
            desc="Conteúdo, identidade e integrações do site"
          />
        )}
      </div>

      <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Últimos veículos cadastrados</h2>
          <Link href="/admin/veiculos" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg">Nenhum veículo ainda</h3>
            <p className="text-sm text-muted-foreground mt-1">Adicione o primeiro veículo do catálogo.</p>
            {isAdmin && (
              <Button asChild className="mt-5 rounded-full">
                <Link href="/admin/veiculo/novo">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar veículo
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recent.map((v) => (
              <Link
                key={v.id}
                href={isAdmin ? `/admin/veiculo/${v.id}` : "/admin/vendas"}
                className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={v.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200"}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{v.brand} {v.model}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.version || v.year} · Estoque: {v.stock_quantity ?? 0}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-sm">{formatCurrency(v.price)}</div>
                  <StatusBadge status={v.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value, loading, small, accent }) {
  const accentColors = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
  };
  const iconBg = accentColors[accent] || "bg-secondary text-foreground";
  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 border border-border/50">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
      <div className={`font-display font-bold mt-0.5 ${small ? "text-base" : "text-2xl"}`}>
        {loading ? "-" : value}
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, desc, badge }) {
  return (
    <Link
      href={href}
      className="group bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all flex items-center gap-4 relative"
    >
      <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center relative">
        <Icon className="w-5 h-5" aria-hidden="true" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
    </Link>
  );
}

function StatusBadge({ status }) {
  const map = {
    disponivel: "bg-green-100 text-green-700",
    reservado: "bg-yellow-100 text-yellow-700",
    vendido: "bg-red-100 text-red-700",
  };
  const label = { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido" };
  return (
    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] || map.disponivel}`}>
      {label[status] || "Disponível"}
    </span>
  );
}

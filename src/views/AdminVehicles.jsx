'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchVehiclesAdmin, VEHICLES_ADMIN_QUERY_KEY } from "@/lib/vehicleQueries";
import { Plus, Car, Search, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import AdminShell from "../components/admin/AdminShell";

export default function AdminVehicles() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: VEHICLES_ADMIN_QUERY_KEY,
    queryFn: fetchVehiclesAdmin,
  });

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${v.brand} ${v.model} ${v.version || ""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [vehicles, search, statusFilter]);

  return (
    <AdminShell
      title="Veículos"
      subtitle={`${vehicles.length} cadastrado${vehicles.length !== 1 ? "s" : ""} no total`}
      actions={
        <Button asChild className="rounded-full h-10 px-5 font-semibold">
          <Link href="/admin/veiculo/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo veículo
          </Link>
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca, modelo ou versão…"
            aria-label="Buscar veículos"
            className="pl-11 h-11 rounded-full bg-secondary border-0"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-11 rounded-full" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="disponivel">Disponíveis</SelectItem>
            <SelectItem value="reservado">Reservados</SelectItem>
            <SelectItem value="vendido">Vendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg">
              {vehicles.length === 0 ? "Nenhum veículo cadastrado" : "Nenhum resultado"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {vehicles.length === 0
                ? "Comece adicionando o primeiro veículo."
                : "Tente ajustar a busca ou o filtro."}
            </p>
            {vehicles.length === 0 && (
              <Button asChild className="mt-5 rounded-full">
                <Link href="/admin/veiculo/novo">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar veículo
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((v) => (
              <Link
                key={v.id}
                href={`/admin/veiculo/${v.id}`}
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{v.brand} {v.model}</h3>
                    {v.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold uppercase flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" aria-hidden="true" /> Destaque
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.version || v.year}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {v.price_old && v.price_old > v.price && (
                    <div className="text-[10px] text-muted-foreground line-through leading-none">
                      {formatCurrency(v.price_old)}
                    </div>
                  )}
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
'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchVehiclesAdmin, VEHICLES_ADMIN_QUERY_KEY } from "@/lib/vehicleQueries";
import { adminFetch, downloadAdminFile } from "@/lib/adminApi";
import { useAuth } from "@/lib/AuthContext";
import { formatCurrency } from "@/lib/formatters";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Loader2, Pencil, ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";

const todayLocal = () => new Date().toISOString().slice(0, 10);

export default function AdminSales() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const isAdmin = ["admin", "super_admin"].includes(profile?.role);
  const preselectedVehicle = searchParams.get("veiculo");

  const [form, setForm] = useState({
    vehicle_id: preselectedVehicle || "",
    seller_id: "",
    quantity: "1",
    sale_price: "",
    customer_name: "",
    customer_phone: "",
    payment_method: "",
    sold_at: todayLocal(),
    notes: "",
  });
  const [editSale, setEditSale] = useState(null);
  const [deleteSale, setDeleteSale] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: VEHICLES_ADMIN_QUERY_KEY,
    queryFn: fetchVehiclesAdmin,
  });

  const { data: usersPayload } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => adminFetch("/api/admin/users"),
    enabled: isAdmin && (profile?.role === "super_admin" || profile?.module_access?.usuarios !== false),
  });

  const { data: salesPayload, isLoading } = useQuery({
    queryKey: ["adminSales"],
    queryFn: () => adminFetch("/api/admin/sales"),
  });

  const users = usersPayload?.users || [];
  const sellers = users.filter((user) => user.active && ["admin", "vendedor"].includes(user.role));
  const sales = salesPayload?.sales || [];
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicle_id);

  useEffect(() => {
    if (selectedVehicle && !form.sale_price) {
      setForm((current) => ({ ...current, sale_price: String(selectedVehicle.price || "") }));
    }
  }, [selectedVehicle, form.sale_price]);

  const saleMutation = useMutation({
    mutationFn: (payload) => adminFetch("/api/admin/sales", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      toast.success("Venda registrada e estoque atualizado.");
      queryClient.invalidateQueries({ queryKey: ["adminSales"] });
      queryClient.invalidateQueries({ queryKey: VEHICLES_ADMIN_QUERY_KEY });
      setForm((current) => ({
        ...current,
        quantity: "1",
        customer_name: "",
        customer_phone: "",
        payment_method: "",
        notes: "",
      }));
    },
    onError: (error) => toast.error(error.message),
  });

  const updateSaleMutation = useMutation({
    mutationFn: ({ id, ...payload }) => adminFetch(`/api/admin/sales/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      toast.success("Venda atualizada.");
      setEditSale(null);
      queryClient.invalidateQueries({ queryKey: ["adminSales"] });
      queryClient.invalidateQueries({ queryKey: VEHICLES_ADMIN_QUERY_KEY });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteSaleMutation = useMutation({
    mutationFn: (id) => adminFetch(`/api/admin/sales/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Venda excluida e estoque restaurado.");
      setDeleteSale(null);
      queryClient.invalidateQueries({ queryKey: ["adminSales"] });
      queryClient.invalidateQueries({ queryKey: VEHICLES_ADMIN_QUERY_KEY });
    },
    onError: (error) => toast.error(error.message),
  });

  const totals = useMemo(() => {
    return sales.reduce((acc, sale) => {
      acc.quantity += sale.quantity || 0;
      acc.value += Number(sale.sale_price || 0) * (sale.quantity || 1);
      return acc;
    }, { quantity: 0, value: 0 });
  }, [sales]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    saleMutation.mutate({
      ...form,
      quantity: Number(form.quantity),
      sold_at: form.sold_at ? new Date(`${form.sold_at}T12:00:00`).toISOString() : new Date().toISOString(),
    });
  };

  const openEditSale = (sale) => setEditSale({
    id: sale.id,
    vehicle_id: sale.vehicle_id,
    seller_id: sale.seller_id || "",
    quantity: String(sale.quantity || 1),
    sale_price: String(sale.sale_price || ""),
    customer_name: sale.customer_name || "",
    customer_phone: sale.customer_phone || "",
    payment_method: sale.payment_method || "",
    sold_at: sale.sold_at ? new Date(sale.sold_at).toISOString().slice(0, 10) : todayLocal(),
    notes: sale.notes || "",
  });

  const submitEditSale = () => {
    if (!editSale) return;
    updateSaleMutation.mutate({
      ...editSale,
      quantity: Number(editSale.quantity),
      sold_at: editSale.sold_at ? new Date(`${editSale.sold_at}T12:00:00`).toISOString() : new Date().toISOString(),
    });
  };

  const exportSales = async () => {
    setIsExporting(true);
    try {
      await downloadAdminFile("/api/admin/sales/export", "vendas.xlsx");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminShell
      title="Vendas"
      subtitle="Registre vendas, acompanhe histórico e mantenha o estoque consistente."
      actions={
        <Button variant="outline" className="rounded-full h-10 px-4 font-semibold" onClick={exportSales} disabled={isExporting}>
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Exportar XLSX
        </Button>
      }
    >
      <div className="grid lg:grid-cols-[380px_1fr] gap-5">
        <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Nova venda</h2>
              <p className="text-xs text-muted-foreground">A baixa no estoque é automática.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Veículo</Label>
            <Select value={form.vehicle_id} onValueChange={(value) => update("vehicle_id", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} · estoque {vehicle.stock_quantity ?? 0}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVehicle && (
              <p className="text-xs text-muted-foreground">
                Disponível: {selectedVehicle.stock_quantity ?? 0} · Preço anunciado: {formatCurrency(selectedVehicle.price)}
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label>Vendedor responsável</Label>
              <Select value={form.seller_id} onValueChange={(value) => update("seller_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Usar meu usuário" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.nome || seller.email} · {seller.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.sold_at} onChange={(e) => update("sold_at", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor da venda</Label>
            <Input value={form.sale_price} onChange={(e) => update("sale_price", e.target.value)} placeholder="189900" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} placeholder="Nome do comprador" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Input value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)} placeholder="Financiamento, pix, troca..." />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full rounded-full h-11 font-semibold" disabled={saleMutation.isPending}>
            {saleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ReceiptText className="w-4 h-4 mr-2" />}
            Registrar venda
          </Button>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Veículos vendidos" value={totals.quantity} />
            <Metric label="Valor vendido" value={formatCurrency(totals.value)} />
          </div>

          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h2 className="font-display font-bold text-lg">Histórico de vendas</h2>
              <p className="text-xs text-muted-foreground">Últimos registros comerciais da loja.</p>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : sales.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma venda registrada ainda.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    {isAdmin && <TableHead className="text-right">Acoes</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">{sale.vehicle ? `${sale.vehicle.brand} ${sale.vehicle.model}` : "Veículo removido"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sale.sold_at).toLocaleDateString("pt-BR")} · qtd. {sale.quantity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sale.seller?.nome || sale.seller?.email || "Sem vendedor"}</Badge>
                      </TableCell>
                      <TableCell>{sale.customer_name || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(sale.sale_price)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEditSale(sale)}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" className="rounded-full" onClick={() => setDeleteSale(sale)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!editSale} onOpenChange={(open) => !open && setEditSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar venda</DialogTitle>
            <DialogDescription>Alteracoes de veiculo ou quantidade ajustam o estoque automaticamente.</DialogDescription>
          </DialogHeader>
          {editSale && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Veiculo</Label>
                <Select value={editSale.vehicle_id} onValueChange={(value) => setEditSale((s) => ({ ...s, vehicle_id: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - estoque {vehicle.stock_quantity ?? 0}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={editSale.seller_id} onValueChange={(value) => setEditSale((s) => ({ ...s, seller_id: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.nome || seller.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" min="1" value={editSale.quantity} onChange={(e) => setEditSale((s) => ({ ...s, quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={editSale.sold_at} onChange={(e) => setEditSale((s) => ({ ...s, sold_at: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input value={editSale.sale_price} onChange={(e) => setEditSale((s) => ({ ...s, sale_price: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input value={editSale.customer_name} onChange={(e) => setEditSale((s) => ({ ...s, customer_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={editSale.customer_phone} onChange={(e) => setEditSale((s) => ({ ...s, customer_phone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Input value={editSale.payment_method} onChange={(e) => setEditSale((s) => ({ ...s, payment_method: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Observacoes</Label>
                <Textarea value={editSale.notes} onChange={(e) => setEditSale((s) => ({ ...s, notes: e.target.value }))} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSale(null)}>Cancelar</Button>
            <Button onClick={submitEditSale} disabled={updateSaleMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteSale} onOpenChange={(open) => !open && setDeleteSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir venda</DialogTitle>
            <DialogDescription>
              Esta acao remove o registro e devolve {deleteSale?.quantity || 0} unidade(s) ao estoque.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSale(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteSaleMutation.mutate(deleteSale.id)} disabled={deleteSaleMutation.isPending}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="font-display font-bold text-xl mt-1">{value}</div>
    </div>
  );
}

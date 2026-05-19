'use client';

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminApi";
import AdminShell from "@/components/admin/AdminShell";
import AdminGuard from "@/components/admin/AdminGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";

const emptyUser = { nome: "", email: "", password: "", role: "vendedor" };

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState(emptyUser);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: usersPayload, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => adminFetch("/api/admin/users"),
  });
  const { data: logsPayload } = useQuery({
    queryKey: ["adminUserLogs"],
    queryFn: () => adminFetch("/api/admin/user-logs"),
  });

  const users = usersPayload?.users || [];
  const logs = logsPayload?.logs || [];

  const stats = useMemo(() => ({
    admins: users.filter((user) => user.role === "admin").length,
    sellers: users.filter((user) => user.role === "vendedor").length,
    inactive: users.filter((user) => !user.active).length,
  }), [users]);

  const createMutation = useMutation({
    mutationFn: (payload) => adminFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      toast.success("Usuário criado. Ele trocará a senha no primeiro acesso.");
      setNewUser(emptyUser);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserLogs"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => adminFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      toast.success("Usuário atualizado.");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserLogs"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const submitCreate = (event) => {
    event.preventDefault();
    createMutation.mutate(newUser);
  };

  const submitReset = () => {
    if (!resetTarget || !newPassword) return;
    updateMutation.mutate({ id: resetTarget.id, password: newPassword });
    setResetTarget(null);
    setNewPassword("");
  };

  return (
    <AdminGuard adminOnly>
      <AdminShell title="Usuários" subtitle="Controle acessos, papéis, status e reset de senha.">
        <div className="grid lg:grid-cols-[360px_1fr] gap-5">
          <div className="space-y-4">
            <form onSubmit={submitCreate} className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Novo usuário</h2>
                  <p className="text-xs text-muted-foreground">E-mail já nasce confirmado.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={newUser.nome} onChange={(e) => setNewUser((u) => ({ ...u, nome: e.target.value }))} placeholder="Nome do colaborador" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Senha temporária</Label>
                <Input type="password" value={newUser.password} onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))} minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select value={newUser.role} onValueChange={(role) => setNewUser((u) => ({ ...u, role }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-full h-11 font-semibold" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Criar usuário
              </Button>
            </form>

            <div className="grid grid-cols-3 gap-3">
              <Metric label="Admins" value={stats.admins} />
              <Metric label="Vendedores" value={stats.sellers} />
              <Metric label="Inativos" value={stats.inactive} />
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border/50">
                <h2 className="font-display font-bold text-lg">Equipe</h2>
                <p className="text-xs text-muted-foreground">Administradores editam tudo. Vendedores consultam catálogo e registram vendas.</p>
              </div>
              {isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.nome || user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Último acesso: {user.last_login_at ? new Date(user.last_login_at).toLocaleString("pt-BR") : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(role) => updateMutation.mutate({ id: user.id, role })}>
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="vendedor">Vendedor</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={!!user.active}
                              onCheckedChange={(active) => updateMutation.mutate({ id: user.id, active })}
                            />
                            <div className="space-y-1">
                              <Badge variant={user.active ? "secondary" : "destructive"}>{user.active ? "Ativo" : "Inativo"}</Badge>
                              {user.must_change_password && <Badge variant="outline">Trocar senha</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setResetTarget(user)}>
                            <KeyRound className="w-4 h-4 mr-2" /> Resetar senha
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border/50 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="font-display font-bold text-lg">Logs administrativos</h2>
                  <p className="text-xs text-muted-foreground">Criações, alterações, resets e registros de venda.</p>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {logs.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground text-center">Nenhum log registrado.</div>
                ) : logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-sm">{formatAction(log.action)}</div>
                      <div className="text-xs text-muted-foreground">
                        Por {log.actor?.nome || log.actor?.email || "sistema"}
                        {log.target ? ` · alvo: ${log.target.nome || log.target.email}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resetar senha</DialogTitle>
              <DialogDescription>
                Defina uma senha temporária. O usuário será obrigado a trocar no próximo acesso.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Nova senha temporária</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetTarget(null)}>Cancelar</Button>
              <Button onClick={submitReset} disabled={updateMutation.isPending || newPassword.length < 6}>
                Confirmar reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminShell>
    </AdminGuard>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="font-display font-bold text-xl">{value}</div>
    </div>
  );
}

function formatAction(action) {
  const labels = {
    usuario_criado: "Usuário criado",
    usuario_atualizado: "Usuário atualizado",
    senha_resetada: "Senha resetada",
    venda_registrada: "Venda registrada",
  };
  return labels[action] || action;
}

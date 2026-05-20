'use client';

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { adminFetch } from "@/lib/adminApi";
import { useAuth } from "@/lib/AuthContext";
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
import { Eye, Loader2, Pencil, ShieldCheck, Trash2, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";

const emptyUser = { nome: "", email: "", password: "", role: "vendedor" };

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { isSuperAdmin, startSimulation, isSimulating } = useAuth();
  const canManageModuleBlocks = isSuperAdmin && !isSimulating;
  const [newUser, setNewUser] = useState(emptyUser);
  const [resetTarget, setResetTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: usersPayload, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => adminFetch("/admin-api/users"),
  });
  const { data: logsPayload } = useQuery({
    queryKey: ["adminUserLogs"],
    queryFn: () => adminFetch("/admin-api/user-logs"),
  });
  const { data: moduleAccessPayload } = useQuery({
    queryKey: ["adminModuleAccess"],
    queryFn: () => adminFetch("/admin-api/module-access"),
    enabled: canManageModuleBlocks,
  });

  const users = usersPayload?.users || [];
  const logs = logsPayload?.logs || [];

  const stats = useMemo(() => ({
    superAdmins: users.filter((user) => user.role === "super_admin").length,
    admins: users.filter((user) => user.role === "admin").length,
    sellers: users.filter((user) => user.role === "vendedor").length,
    inactive: users.filter((user) => !user.active).length,
  }), [users]);

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc("admin_create_user", {
        p_email: payload.email,
        p_password: payload.password,
        p_nome: payload.nome || "",
        p_role: payload.role || "vendedor",
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário criado. Ele trocará a senha no primeiro acesso.");
      setNewUser(emptyUser);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserLogs"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => adminFetch(`/admin-api/users/${id}`, {
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

  const deleteMutation = useMutation({
    mutationFn: (id) => adminFetch(`/admin-api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Usuario excluido.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserLogs"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const moduleMutation = useMutation({
    mutationFn: (payload) => adminFetch("/admin-api/module-access", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      toast.success("Bloqueio atualizado.");
      queryClient.invalidateQueries({ queryKey: ["adminModuleAccess"] });
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

  const openEdit = (user) => setEditTarget({
    id: user.id,
    nome: user.nome || "",
    email: user.email || "",
    role: user.role,
    active: !!user.active,
  });

  const submitEdit = () => {
    if (!editTarget) return;
    updateMutation.mutate(editTarget, {
      onSuccess: () => setEditTarget(null),
    });
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
                    {isSuperAdmin && <SelectItem value="super_admin">Super admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-full h-11 font-semibold" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Criar usuário
              </Button>
            </form>

            <div className="grid grid-cols-2 gap-3">
              {isSuperAdmin && <Metric label="Super admins" value={stats.superAdmins} />}
              <Metric label="Admins" value={stats.admins} />
              <Metric label="Vendedores" value={stats.sellers} />
              <Metric label="Inativos" value={stats.inactive} />
            </div>

            {canManageModuleBlocks && moduleAccessPayload && (
              <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
                <div>
                  <h2 className="font-display font-bold text-lg">Bloqueios globais por modulo</h2>
                  <p className="text-xs text-muted-foreground">Use em caso de inadimplencia. As politicas de acesso continuam definindo quem pode usar cada modulo.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {moduleAccessPayload.modules.map((moduleKey) => {
                    const enabled = moduleAccessPayload.access?.[moduleKey] !== false;
                    return (
                      <label key={moduleKey} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs">
                        <span className="capitalize">{moduleKey}</span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => moduleMutation.mutate({ module_key: moduleKey, enabled: checked })}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
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
                              {isSuperAdmin && <SelectItem value="super_admin">Super admin</SelectItem>}
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
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(user)}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </Button>
                            {isSuperAdmin && user.role !== "super_admin" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => startSimulation(user.id)}
                                disabled={isSimulating}
                              >
                                <Eye className="w-4 h-4 mr-2" /> Simular
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setResetTarget(user)}>
                              <KeyRound className="w-4 h-4 mr-2" /> Resetar senha
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="rounded-full"
                              onClick={() => setDeleteTarget(user)}
                              disabled={user.role === "super_admin" && !isSuperAdmin}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </Button>
                          </div>
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

        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar usuario</DialogTitle>
              <DialogDescription>Atualize nome, e-mail, papel e status.</DialogDescription>
            </DialogHeader>
            {editTarget && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={editTarget.nome} onChange={(e) => setEditTarget((u) => ({ ...u, nome: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={editTarget.email} onChange={(e) => setEditTarget((u) => ({ ...u, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select value={editTarget.role} onValueChange={(role) => setEditTarget((u) => ({ ...u, role }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {isSuperAdmin && <SelectItem value="super_admin">Super admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                  <span className="text-sm">Usuario ativo</span>
                  <Switch checked={editTarget.active} onCheckedChange={(active) => setEditTarget((u) => ({ ...u, active }))} />
                </label>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
              <Button onClick={submitEdit} disabled={updateMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir usuario</DialogTitle>
              <DialogDescription>
                Esta acao remove o acesso de {deleteTarget?.nome || deleteTarget?.email}. Registros historicos permanecem preservados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
                Excluir
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
    venda_atualizada: "Venda atualizada",
    venda_excluida: "Venda excluida",
    usuario_excluido: "Usuario excluido",
    modulo_acesso_atualizado: "Bloqueio de modulo atualizado",
  };
  return labels[action] || action;
}

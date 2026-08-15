'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabaseClient";
import { adminFetch } from "@/lib/adminApi";
import { useAuth } from "@/lib/AuthContext";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminChangePassword() {
  const router = useRouter();
  const { reloadProfile } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    try {
      await adminFetch("/api/admin/me", {
        method: "PATCH",
        body: JSON.stringify({ must_change_password: false }),
      });
      await reloadProfile();
      toast.success("Senha alterada com sucesso.");
      router.replace("/admin");
    } catch (apiError) {
      toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell title="Alterar senha" subtitle="Por segurança, troque a senha temporária antes de continuar.">
      <div className="max-w-md bg-card border border-border/50 rounded-2xl p-6">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
          </div>
          <Button type="submit" className="w-full rounded-full h-11 font-semibold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
            Salvar senha
          </Button>
        </form>
      </div>
    </AdminShell>
  );
}

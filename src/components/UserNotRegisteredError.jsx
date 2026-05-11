import React from "react";
import { ShieldAlert } from "lucide-react";

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="max-w-md w-full bg-card rounded-3xl shadow-xl border border-border p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100 dark:bg-orange-500/10">
          <ShieldAlert className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">Acesso restrito</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Você não está cadastrado para acessar esta aplicação. Entre em contato com o
          administrador para solicitar acesso.
        </p>
        <div className="p-4 bg-secondary rounded-2xl text-sm text-muted-foreground text-left">
          <p className="font-medium text-foreground mb-2">Se acha que isso é um engano:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Confirme se está usando a conta correta</li>
            <li>Peça acesso ao administrador da loja</li>
            <li>Tente sair e entrar novamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
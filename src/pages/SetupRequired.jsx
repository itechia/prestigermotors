import React from "react";
import { AlertTriangle, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const ENV_CONTENT = `VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...sua_service_role_key`;

export default function SetupRequired() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(ENV_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="font-bold text-xl">Configuração necessária</h1>
            <p className="text-zinc-400 text-sm">O Supabase ainda não foi conectado.</p>
          </div>
        </div>

        {/* Passos */}
        <div className="space-y-4">
          <Step n={1} title="Crie um projeto Supabase gratuito">
            <a
              href="https://supabase.com/dashboard/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              supabase.com/dashboard/new <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Step>

          <Step n={2} title="Execute o schema do banco">
            <p className="text-zinc-400 text-sm">
              No painel do Supabase → <span className="text-zinc-200">SQL Editor</span> → cole o conteúdo do arquivo{" "}
              <code className="bg-zinc-800 px-1 rounded text-xs">supabase/schema.sql</code> e execute.
            </p>
          </Step>

          <Step n={3} title="Crie o bucket de uploads">
            <p className="text-zinc-400 text-sm">
              Supabase → <span className="text-zinc-200">Storage</span> → New bucket → nome{" "}
              <code className="bg-zinc-800 px-1 rounded text-xs">uploads</code> → marque como <strong>Public</strong>.
            </p>
          </Step>

          <Step n={4} title='Crie o arquivo .env.local na raiz do projeto'>
            <div className="relative mt-2">
              <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto">{ENV_CONTENT}</pre>
              <button
                onClick={copy}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                title="Copiar"
              >
                {copied
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <Copy className="w-4 h-4 text-zinc-400" />}
              </button>
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              As chaves estão em: Supabase → seu projeto → Settings → API
            </p>
          </Step>

          <Step n={5} title="Crie seu usuário admin">
            <p className="text-zinc-400 text-sm">
              Supabase → <span className="text-zinc-200">Authentication → Users</span> → Add user → defina seu e-mail e senha.
            </p>
          </Step>

          <Step n={6} title="Reinicie o servidor de desenvolvimento">
            <code className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-sm block text-emerald-400">
              npm run dev
            </code>
          </Step>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}

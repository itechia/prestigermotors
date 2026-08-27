'use client';

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminApi";
import { useSitePages, SITE_PAGES_QUERY_KEY } from "@/lib/useSitePages";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Link2, Loader2, Pencil, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import MarkdownContent from "@/components/MarkdownContent";
import { toast } from "sonner";

const emptyForm = {
  id: null,
  title: "",
  slug: "",
  kind: "page",
  body_markdown: "",
  link_url: "",
  link_type: "external",
  published: true,
};

function resolvePageHref(page) {
  if (page.kind === "link") return page.link_url || "#";
  return `/pagina/${page.slug}`;
}

export default function SitePagesManager() {
  const queryClient = useQueryClient();
  const { pages, isLoading } = useSitePages();
  const [form, setForm] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: SITE_PAGES_QUERY_KEY });

  const saveMutation = useMutation({
    mutationFn: (payload) => payload.id
      ? adminFetch(`/api/admin/site-pages/${payload.id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : adminFetch("/api/admin/site-pages", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Página salva.");
      setForm(null);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminFetch(`/api/admin/site-pages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Página excluída.");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const openNew = () => {
    setForm({ ...emptyForm });
    setSlugTouched(false);
    setPreview(false);
  };

  const openEdit = (page) => {
    setForm({ ...emptyForm, ...page });
    setSlugTouched(true);
    setPreview(false);
  };

  const updateForm = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateTitle = (title) => {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
    }));
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Informe um título.");
      return;
    }
    if (form.kind === "link" && !form.link_url.trim()) {
      toast.error("Informe a URL do link.");
      return;
    }
    saveMutation.mutate({
      id: form.id,
      title: form.title.trim(),
      slug: form.slug,
      kind: form.kind,
      body_markdown: form.body_markdown,
      link_url: form.link_url,
      link_type: form.link_type,
      published: form.published,
    });
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-6 text-center">Carregando...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Nenhuma página criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => {
            const Icon = page.kind === "link" ? Link2 : FileText;
            const href = resolvePageHref(page);
            return (
              <div
                key={page.id}
                className="grid grid-cols-[20px_minmax(160px,280px)_1fr_auto] items-center gap-4 bg-secondary/40 rounded-xl px-4 py-2.5"
              >
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />

                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{page.title}</span>
                  <Badge variant={page.published ? "secondary" : "outline"} className="shrink-0">
                    {page.published ? "Publicada" : "Rascunho"}
                  </Badge>
                </div>

                {page.published ? (
                  <a
                    href={href}
                    target={page.kind === "link" ? "_blank" : undefined}
                    rel={page.kind === "link" ? "noreferrer" : undefined}
                    className="min-w-0 text-xs text-muted-foreground font-mono truncate hover:text-primary hover:underline"
                  >
                    {href}
                  </a>
                ) : (
                  <span className="min-w-0 text-xs text-muted-foreground/70 font-mono truncate">
                    {href}
                  </span>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button type="button" variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => openEdit(page)}>
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button type="button" variant="destructive" size="icon" className="rounded-full h-8 w-8" onClick={() => setDeleteTarget(page)}>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button type="button" variant="outline" onClick={openNew} className="w-full rounded-2xl border-2 border-dashed h-11">
        <Plus className="w-4 h-4 mr-2" /> Nova página
      </Button>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar item" : "Novo item"}</DialogTitle>
            <DialogDescription>
              Escreva uma página em Markdown ou aponte direto para um link — os dois aparecem juntos no rodapé.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="flex rounded-xl border border-border overflow-hidden bg-background h-9 w-fit">
                  <button
                    type="button"
                    onClick={() => updateForm("kind", "page")}
                    className={cn(
                      "px-3.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                      form.kind === "page" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" /> Página (Markdown)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm("kind", "link")}
                    className={cn(
                      "px-3.5 text-xs font-medium transition-colors border-l border-border flex items-center gap-1.5",
                      form.kind === "link" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Link2 className="w-3.5 h-3.5" /> Link
                  </button>
                </div>
              </div>

              <div className={form.kind === "page" ? "grid sm:grid-cols-2 gap-3" : ""}>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => updateTitle(e.target.value)} placeholder="Política de Privacidade" />
                </div>
                {form.kind === "page" && (
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <div className="flex items-center h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <span className="text-muted-foreground shrink-0">/pagina/</span>
                      <input
                        value={form.slug}
                        onChange={(e) => { setSlugTouched(true); updateForm("slug", slugify(e.target.value)); }}
                        className="flex-1 min-w-0 bg-transparent outline-none font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">Publicada (visível no site)</span>
                <Switch checked={form.published} onCheckedChange={(v) => updateForm("published", v)} />
              </label>

              {form.kind === "link" ? (
                <div className="space-y-2">
                  <Label>Link</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex rounded-xl border border-border overflow-hidden bg-background h-9 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateForm("link_type", "domain")}
                        className={cn(
                          "px-3 text-xs font-medium transition-colors",
                          form.link_type === "domain" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Página do site
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm("link_type", "external")}
                        className={cn(
                          "px-3 text-xs font-medium transition-colors border-l border-border",
                          form.link_type === "external" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Link externo
                      </button>
                    </div>
                    <Input
                      value={form.link_url}
                      onChange={(e) => updateForm("link_url", e.target.value)}
                      placeholder={form.link_type === "domain" ? "/sobre, /contato..." : "https://..."}
                      className="rounded-xl flex-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Conteúdo (Markdown)</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
                      {preview ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                      {preview ? "Editar" : "Visualizar"}
                    </Button>
                  </div>
                  {preview ? (
                    <div className="border border-border rounded-xl p-4 max-h-80 overflow-y-auto">
                      <MarkdownContent content={form.body_markdown} />
                    </div>
                  ) : (
                    <Textarea
                      value={form.body_markdown}
                      onChange={(e) => updateForm("body_markdown", e.target.value)}
                      rows={14}
                      className="font-mono text-xs resize-none"
                      placeholder={"## Política de Privacidade\n\nEscreva aqui o texto completo..."}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
            <Button type="button" onClick={submit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir item</DialogTitle>
            <DialogDescription>
              Isso remove &quot;{deleteTarget?.title}&quot; do rodapé e de qualquer link destacado numa coluna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

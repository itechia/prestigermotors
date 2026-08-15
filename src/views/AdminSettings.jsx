'use client';

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Store, Sparkles, ShieldCheck, MessageCircleHeart, Tag, PanelBottom, ListTree, Webhook, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoreSettingsRaw } from "@/lib/useStoreSettings";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DEFAULT_SETTINGS, SETTINGS_RAW_QUERY_KEY, SETTINGS_SINGLETON_QUERY_KEY } from "@/lib/defaults";
import AdminShell from "../components/admin/AdminShell";
import SettingsGeneral from "../components/admin/settings/SettingsGeneral";
import SettingsHero from "../components/admin/settings/SettingsHero";
import SettingsTrust from "../components/admin/settings/SettingsTrust";
import SettingsReviews from "../components/admin/settings/SettingsReviews";
import SettingsBrands from "../components/admin/settings/SettingsBrands";
import SettingsFooter from "../components/admin/settings/SettingsFooter";
import SettingsTaxonomies from "../components/admin/settings/SettingsTaxonomies";
import SettingsInterestForm from "../components/admin/settings/SettingsInterestForm";
import SettingsWebhooks from "../components/admin/settings/SettingsWebhooks";
import { VEHICLE_TAXONOMIES_QUERY_KEY } from "@/lib/useTaxonomies";
import { adminFetch } from "@/lib/adminApi";

const TABS = [
  { id: "general", label: "Loja", icon: Store },
  { id: "hero", label: "Banner", icon: Sparkles },
  { id: "brands", label: "Marcas", icon: Tag },
  { id: "taxonomies", label: "Categorias", icon: ListTree },
  { id: "trust", label: "Garantias", icon: ShieldCheck },
  { id: "reviews", label: "Depoimentos", icon: MessageCircleHeart },
  { id: "interestform", label: "Formulário", icon: MousePointerClick },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "footer", label: "Rodapé", icon: PanelBottom },
];

export default function AdminSettings() {
  const { data: record, isLoading } = useStoreSettingsRaw();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "general";
  const setTab = (id) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.replace(`${pathname}?${params.toString()}`);
  };
  const [form, setForm] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    // Merge saved record over defaults so every field has a sane value.
    setForm({ ...DEFAULT_SETTINGS, ...(record || {}) });
  }, [record]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const { id: _id, created_date: _cd, updated_date: _ud, created_by: _cb, ...payload } = form;
      return adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_SINGLETON_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SETTINGS_RAW_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: VEHICLE_TAXONOMIES_QUERY_KEY });
      toast.success("Configurações salvas!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  return (
    <AdminShell
      title="Configurações do site"
      subtitle="Edite tudo que aparece no seu site, em tempo real."
      actions={
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || isLoading}
          className="rounded-full h-10 px-5 font-semibold"
        >
          <Save className="w-4 h-4 mr-2" />
          {save.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      }
    >
      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={active}
              className={cn(
                "min-h-11 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-colors relative",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-secondary rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {tab === "general" && <SettingsGeneral form={form} update={update} />}
          {tab === "hero" && <SettingsHero form={form} update={update} />}
          {tab === "brands" && <SettingsBrands form={form} update={update} />}
          {tab === "taxonomies" && <SettingsTaxonomies form={form} update={update} />}
          {tab === "trust" && <SettingsTrust form={form} update={update} />}
          {tab === "reviews" && <SettingsReviews form={form} update={update} />}
          {tab === "interestform" && <SettingsInterestForm form={form} update={update} />}
          {tab === "webhooks" && <SettingsWebhooks form={form} update={update} />}
          {tab === "footer" && <SettingsFooter form={form} update={update} />}
        </div>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-30">
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || isLoading}
          className="rounded-full h-12 px-6 font-semibold shadow-xl"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </AdminShell>
  );
}

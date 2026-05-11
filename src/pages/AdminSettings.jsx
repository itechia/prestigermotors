import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Save, Store, Sparkles, ShieldCheck, MessageCircleHeart, Tag, PanelBottom, ListTree, Webhook, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoreSettingsRaw } from "@/lib/useStoreSettings";
import { DEFAULT_SETTINGS, SETTINGS_SINGLETON_QUERY_KEY } from "@/lib/defaults";
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
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    // Merge saved record over defaults so every field has a sane value.
    setForm({ ...DEFAULT_SETTINGS, ...(record || {}) });
  }, [record]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      // eslint-disable-next-line no-unused-vars
      const { id: _id, created_date: _cd, updated_date: _ud, created_by: _cb, ...payload } = form;
      if (record?.id) {
        const { error } = await supabase
          .from("store_settings")
          .update({ ...payload, updated_date: now })
          .eq("id", record.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("store_settings")
        .insert({ id: crypto.randomUUID(), ...payload, created_date: now, updated_date: now });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_SINGLETON_QUERY_KEY });
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
          {save.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-light whitespace-nowrap transition-colors relative",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {active && <span className="absolute bottom-[-1px] left-2 right-2 h-0.5 bg-primary rounded-full" />}
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
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </AdminShell>
  );
}
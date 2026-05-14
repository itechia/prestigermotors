import React, { useState } from "react";
import { Plus, Trash2, Pencil, Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// A compact editor for simple lists of strings (e.g. colors, fuels).
// Optionally supports a "parent" field per item — used to bind a model to its brand.
//
// Props:
//   items: string[] | { label: string, parent?: string }[]
//   onChange: (next) => void
//   placeholder
//   parentOptions?: { label: string, value: string }[]   // when provided, items become objects
//   parentLabel?: string
export default function SimpleListEditor({
  items = [],
  onChange,
  placeholder = "Adicionar...",
  parentOptions,
  parentLabel = "Vínculo",
}) {
  const usesParent = Array.isArray(parentOptions);
  const [draft, setDraft] = useState("");
  const [draftParent, setDraftParent] = useState(usesParent && parentOptions[0] ? parentOptions[0].value : "");
  const [editing, setEditing] = useState(null); // index of the row being edited
  const [search, setSearch] = useState("");

  // Normalize items into uniform shape for editing
  const normalized = items.map((it) =>
    typeof it === "string" ? { label: it, parent: "" } : { label: it.label || "", parent: it.parent || "" }
  );

  const showSearch = normalized.length > 6;

  const parentLabelFor = (value) =>
    parentOptions?.find((o) => o.value === value)?.label || "—";

  // Filtered items preserving original indices for correct edit/remove operations
  const visibleItems = normalized
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        (usesParent && parentLabelFor(item.parent).toLowerCase().includes(q))
      );
    });

  const emit = (next) => {
    if (usesParent) {
      onChange(next.map((n) => ({ label: n.label, parent: n.parent })));
    } else {
      onChange(next.map((n) => n.label));
    }
  };

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    emit([...normalized, { label, parent: draftParent }]);
    setDraft("");
  };

  const remove = (i) => {
    emit(normalized.filter((_, idx) => idx !== i));
    if (editing === i) setEditing(null);
  };

  const updateLabel = (i, label) => {
    const next = [...normalized];
    next[i] = { ...next[i], label };
    emit(next);
  };

  const updateParent = (i, parent) => {
    const next = [...normalized];
    next[i] = { ...next[i], parent };
    emit(next);
  };

  return (
    <div className="space-y-2">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="h-8 pl-8 pr-8 rounded-lg text-sm bg-secondary/40 border-border/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {normalized.length > 0 && (
        <div className="space-y-1.5">
          {visibleItems.length === 0 && search && (
            <p className="text-sm text-muted-foreground text-center py-3">
              Nenhum resultado para &ldquo;{search}&rdquo;
            </p>
          )}
          {visibleItems.map(({ item, i }) => {
            const isEditing = editing === i;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-secondary/40 rounded-xl p-1.5 border border-border/50"
              >
                {isEditing ? (
                  <>
                    <Input
                      autoFocus
                      value={item.label}
                      onChange={(e) => updateLabel(i, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                      className="h-9 rounded-lg text-sm border-0 bg-background focus-visible:ring-1"
                    />
                    {usesParent && (
                      <Select value={item.parent || ""} onValueChange={(v) => updateParent(i, v)}>
                        <SelectTrigger className="h-9 w-[140px] rounded-lg text-xs">
                          <SelectValue placeholder={parentLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          {parentOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="w-7 h-7 rounded-md hover:bg-background flex items-center justify-center text-green-600"
                      aria-label="Concluir"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-2 text-sm truncate">{item.label || <span className="text-muted-foreground">Sem nome</span>}</div>
                    {usesParent && (
                      <div className="text-xs text-muted-foreground bg-background rounded-md px-2 py-1 w-[140px] truncate">
                        {parentLabelFor(item.parent)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(i)}
                      className="w-7 h-7 rounded-md hover:bg-background flex items-center justify-center"
                      aria-label="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="w-7 h-7 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center"
                  aria-label="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="h-9 rounded-lg text-sm"
        />
        {usesParent && (
          <Select value={draftParent} onValueChange={setDraftParent}>
            <SelectTrigger className="h-9 w-[140px] rounded-lg text-xs">
              <SelectValue placeholder={parentLabel} />
            </SelectTrigger>
            <SelectContent>
              {parentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <button
          type="button"
          onClick={add}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {normalized.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {search
            ? `${visibleItems.length} de ${normalized.length} itens`
            : `${normalized.length} ${normalized.length === 1 ? "item" : "itens"}`}
        </p>
      )}
    </div>
  );
}

import React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

// Generic reusable editor for lists of objects (trust items, guarantees, reviews).
// Props:
//  - items: array of objects
//  - onChange: (newItems) => void
//  - newItem: () => object (factory for a blank item)
//  - renderItem: (item, onItemChange) => JSX
//  - onRemove: (item) => void — optional, called before removing an item (e.g. storage cleanup)
//  - addLabel, itemLabel
export default function ArrayFieldEditor({ items = [], onChange, newItem, renderItem, onRemove, addLabel = "Adicionar", itemLabel = "Item" }) {
  const update = (idx, next) => {
    const copy = [...items];
    copy[idx] = next;
    onChange(copy);
  };
  const remove = (idx) => {
    onRemove?.(items[idx]);
    onChange(items.filter((_, i) => i !== idx));
  };
  const add = () => onChange([...items, newItem()]);
  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="bg-secondary/40 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {itemLabel} {idx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="w-7 h-7 rounded-lg hover:bg-background flex items-center justify-center disabled:opacity-30"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                className="w-7 h-7 rounded-lg hover:bg-background flex items-center justify-center disabled:opacity-30"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="w-7 h-7 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {renderItem(item, (next) => update(idx, next))}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> {addLabel}
      </button>
    </div>
  );
}

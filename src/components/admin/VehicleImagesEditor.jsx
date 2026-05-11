import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Upload, Loader2, X, Star, GripVertical, ImageUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Drag-and-drop reorderable image grid for the vehicle editor.
// - Index 0 is always the cover (badge "Capa").
// - "Definir como capa" promotes any image to position 0.
// - Reorder by dragging.
export default function VehicleImagesEditor({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(
        files.map((file) => base44.integrations.Core.UploadFile({ file }))
      );
      const urls = uploads.map((u) => u.file_url);
      onChange([...(images || []), ...urls]);
      toast.success(`${urls.length} imagem(ns) enviada(s)`);
    } catch {
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
      // Reset the input so the same files can be re-selected later if needed
      e.target.value = "";
    }
  };

  const removeAt = (idx) => onChange(images.filter((_, i) => i !== idx));

  const setAsCover = (idx) => {
    if (idx === 0) return;
    const next = [...images];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="vehicle-images" direction="horizontal" type="image">
        {(dropProvided) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {images.map((img, i) => (
              <Draggable key={`${img}-${i}`} draggableId={`${img}-${i}`} index={i}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden bg-secondary group border border-transparent",
                      snapshot.isDragging && "ring-2 ring-primary shadow-xl",
                      i === 0 && "border-accent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />

                    {/* Cover badge */}
                    {i === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3" /> Capa
                      </span>
                    )}

                    {/* Drag handle */}
                    <button
                      type="button"
                      {...dragProvided.dragHandleProps}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                      title="Arraste para reordenar"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Bottom actions */}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      {i !== 0 ? (
                        <button
                          type="button"
                          onClick={() => setAsCover(i)}
                          className="text-[10px] font-semibold text-white px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" /> Definir capa
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}

            {/* Add button — outside DnD list, never reorders */}
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <ImageUp className="w-6 h-6 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground text-center px-2">
                {uploading ? "Enviando..." : "Adicionar fotos"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

// Re-export a no-op so existing imports for the icon stay valid.
export { Upload };
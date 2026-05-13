import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { Upload, Loader2, X, Star, GripVertical, ArrowUpToLine, Info } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, deleteStorageFile } from "@/lib/uploadFile";

const MAX_BYTES = 5_242_880; // 5 MB por imagem

export default function VehicleImagesManager({ images = [], onChange, hasEmbed = false }) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const all = Array.from(e.target.files || []);
    if (all.length === 0) return;

    const oversized = all.filter((f) => f.size > MAX_BYTES);
    const valid = all.filter((f) => f.size <= MAX_BYTES);

    if (oversized.length > 0) {
      toast.warning(
        `${oversized.length} arquivo(s) ignorado(s) por exceder 1 MB: ${oversized.map((f) => f.name).join(", ")}`
      );
    }
    if (valid.length === 0) return;

    setUploading(true);
    try {
      const uploads = await Promise.all(valid.map((file) => uploadFile({ file, maxBytes: MAX_BYTES })));
      const urls = uploads.map((u) => u.file_url);
      onChange([...(images || []), ...urls]);
      toast.success(`${urls.length} imagem(ns) enviada(s)`);
    } catch (err) {
      toast.error(err?.message || "Erro no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx) => {
    deleteStorageFile(images[idx]); // fire-and-forget
    onChange(images.filter((_, i) => i !== idx));
  };

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
    <div className="space-y-3">
      {/* Aviso quando embed HTML está ativo */}
      {hasEmbed && (
        <div className="flex items-start gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5 text-xs text-primary">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            O <strong>HTML 360°</strong> está ativo e ocupa o <strong>slide 0 (capa)</strong>.
            As fotos abaixo aparecem a partir do slide 1 na galeria.
          </span>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="vehicle-images" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            >
              {images.map((img, i) => (
                <Draggable key={img + i} draggableId={img + i} index={i}>
                  {(p, snapshot) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-secondary group ${
                        snapshot.isDragging ? "ring-2 ring-primary shadow-xl" : ""
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />

                      {/* Badge de capa — só quando embed NÃO está ativo */}
                      {i === 0 && !hasEmbed && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3" /> Capa
                        </span>
                      )}

                      {/* Quando embed está ativo, primeira foto recebe badge "Slide 1" */}
                      {i === 0 && hasEmbed && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary/90 text-foreground text-[10px] font-bold shadow-sm">
                          Slide 1
                        </span>
                      )}

                      {/* Drag handle */}
                      <div
                        {...p.dragHandleProps}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Bottom action bar */}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/75 to-transparent flex items-center justify-between gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i !== 0 && !hasEmbed ? (
                          <button
                            type="button"
                            onClick={() => setAsCover(i)}
                            className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/90 text-slate-900 hover:bg-white inline-flex items-center gap-1"
                          >
                            <ArrowUpToLine className="w-3 h-3" /> Capa
                          </button>
                        ) : <span />}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {uploading ? "Enviando..." : "Adicionar"}
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

      {images.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {hasEmbed
            ? "Arraste para reordenar as fotos. Elas aparecem após o slide 360°."
            : "Arraste para reordenar. A primeira é a capa exibida no catálogo. Máximo 5 MB por imagem."}
        </p>
      )}
    </div>
  );
}

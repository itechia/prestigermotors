import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X } from "lucide-react";
import { uploadFile, deleteStorageFile } from "@/lib/uploadFile";
import { toast } from "sonner";

export default function ImageUploadField({ label, value, onChange, hint, aspectClass = "aspect-video", maxBytes }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (maxBytes && file.size > maxBytes) {
      const kb = Math.round(maxBytes / 1024);
      const label = maxBytes >= 1_048_576 ? `${(maxBytes / 1_048_576).toFixed(0)} MB` : `${kb} KB`;
      toast.error(`Arquivo muito grande. Máximo: ${label}.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await uploadFile({ file, maxBytes });
      onChange(file_url);
    } catch (err) {
      toast.error(err?.message || "Erro no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleClear = () => {
    deleteStorageFile(value); // fire-and-forget; silent if external URL
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>

      {value ? (
        <div className={`relative ${aspectClass} rounded-2xl overflow-hidden bg-secondary border border-border`}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className={`${aspectClass} rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors`}>
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
          <span className="text-xs font-medium text-muted-foreground">
            {uploading ? "Enviando..." : "Clique para enviar imagem"}
          </span>
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      )}

      <div className="flex gap-2 items-center pt-1">
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ou cole uma URL de imagem..."
          className="h-9 rounded-xl text-xs"
        />
      </div>

      {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
    </div>
  );
}

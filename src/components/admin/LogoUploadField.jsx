import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Compact image picker for logos / brand icons.
// Shows a small preview (square or circle) instead of a giant area.
export default function LogoUploadField({
  label,
  value,
  onChange,
  hint,
  shape = "circle", // "circle" | "square"
  size = 64, // px
  previewBg = "bg-secondary",
  showUrlInput = true,
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch {
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-semibold">{label}</Label>}

      <div className="flex items-center gap-3">
        {/* Preview */}
        <div
          className={cn(
            "relative flex items-center justify-center border border-border overflow-hidden flex-shrink-0",
            radiusClass,
            previewBg
          )}
          style={{ width: size, height: size }}
        >
          {value ? (
            <>
              <img src={value} alt="" className="w-full h-full object-contain p-2" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                aria-label="Remover"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Upload button */}
        <label
          className={cn(
            "h-9 px-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium cursor-pointer inline-flex items-center gap-2 transition-colors",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {uploading ? "Enviando..." : value ? "Trocar" : "Enviar imagem"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {showUrlInput && (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ou cole uma URL..."
          className="h-8 rounded-lg text-xs"
        />
      )}

      {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
    </div>
  );
}
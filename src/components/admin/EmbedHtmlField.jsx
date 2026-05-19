import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Renders a textarea for an HTML embed (e.g. 360° iframe), with the option to
// upload a `.html` / `.htm` / `.txt` file (its content is loaded into the field)
// and a button to clear the current HTML.
export default function EmbedHtmlField({ value, onChange }) {
  const [showPreview, setShowPreview] = useState(false);
  const [reading, setReading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result || ""));
      toast.success("Arquivo carregado!");
      setReading(false);
    };
    reader.onerror = () => {
      toast.error("Não foi possível ler o arquivo.");
      setReading(false);
    };
    reader.readAsText(file);
    // allow uploading the same file again
    e.target.value = "";
  };

  const handleClear = () => {
    if (!value?.trim()) return;
    if (confirm("Limpar todo o HTML embed?")) {
      onChange("");
      toast.success("HTML removido");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-sm">HTML embed (ex: 360°)</Label>
        {value?.trim() && (
          <button
            type="button"
            onClick={() => setShowPreview((s) => !s)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Ocultar prévia" : "Ver prévia"}
          </button>
        )}
      </div>

      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder='Cole o iframe ou HTML aqui. Ex: <iframe src="https://..." allowfullscreen></iframe>'
        className="font-mono text-xs"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept=".html,.htm,.txt,text/html,text/plain"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={reading}
          className="rounded-full"
        >
          {reading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 mr-1.5" />
          )}
          Enviar arquivo .html
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!value?.trim()}
          className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Limpar HTML
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Quando preenchido, ocupa o lugar da primeira imagem na galeria do veículo. Use links HTTPS de fontes confiáveis.
      </p>

      {showPreview && value?.trim() && (
        <iframe
          srcDoc={value}
          title="Prévia do HTML embed"
          sandbox="allow-scripts allow-forms allow-popups"
          scrolling="no"
          className="w-full aspect-video rounded-xl border border-border/50 bg-secondary block"
          style={{ border: 'none' }}
        />
      )}
    </div>
  );
}

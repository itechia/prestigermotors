import { useEffect } from "react";
import { FONTS_GOOGLE_HREF } from "@/lib/fonts";

// Carrega, uma única vez, as fontes extras que o admin pode escolher para o
// nome da loja (as demais já vêm do index.css).
//
// IMPORTANTE: este componente NÃO mexe em <title>, favicon, apple-touch-icon
// nem manifest. Essas tags são renderizadas pelo Next (metadata do
// app/layout.jsx) e pertencem ao React — alterá-las por fora quebrava a
// reconciliação na troca de página ("Cannot read properties of null (reading
// 'removeChild')"). O <link> das fontes é só acrescentado e nunca removido,
// então não conflita com nada.
let fontsLinkInjected = false;

function ensureFontsLoaded() {
  if (fontsLinkInjected) return;
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-store-fonts="1"]')) {
    fontsLinkInjected = true;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONTS_GOOGLE_HREF;
  link.setAttribute("data-store-fonts", "1");
  document.head.appendChild(link);
  fontsLinkInjected = true;
}

export default function BrandHead() {
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  return null;
}

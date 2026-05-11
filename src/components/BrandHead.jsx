import { useEffect } from "react";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { FONTS_GOOGLE_HREF } from "@/lib/fonts";
import { buildAppleTouchIconDataURL } from "@/lib/appleIcon";

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

// Keeps document <title> and favicon in sync with the store's name + logo
// configured in the admin (StoreSettings).
export default function BrandHead() {
  const s = useStoreSettings();
  const name = s.store_name || "AutoMarket";
  const tagline = s.store_tagline || "";
  const logo = s.logo_url || "";

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    document.title = tagline ? `${name} — ${tagline}` : name;
  }, [name, tagline]);

  useEffect(() => {
    let cancelled = false;

    const setLink = (rel, href, attrs = {}) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    };

    // Remove any pre-existing apple-touch-icon links so iOS doesn't fall back
    // to the default Base44 icon embedded in the static index.html.
    const removeAllApple = () => {
      document
        .querySelectorAll('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]')
        .forEach((el) => el.parentNode && el.parentNode.removeChild(el));
    };

    const setAppleTouch = (href) => {
      removeAllApple();
      // Provide multiple sizes so iOS picks the best match. Same href is fine
      // because we render at 180x180 (the largest size iOS uses).
      ["180x180", "167x167", "152x152", "120x120"].forEach((sizes) => {
        const el = document.createElement("link");
        el.setAttribute("rel", "apple-touch-icon");
        el.setAttribute("sizes", sizes);
        el.setAttribute("href", href);
        document.head.appendChild(el);
      });
    };

    if (logo) {
      setLink("icon", logo);
      setLink("shortcut icon", logo);

      // iOS "Add to Home Screen" reads ONLY apple-touch-icon and does NOT
      // support SVG. Render the logo to a 180x180 PNG (data URL) so the
      // home screen icon matches the brand instead of falling back to "A".
      buildAppleTouchIconDataURL(logo, { size: 180 }).then((dataUrl) => {
        if (cancelled) return;
        setAppleTouch(dataUrl || logo);
      });
    }

    // Dynamic Web App Manifest — drives the icon/name when the user adds the
    // site to their phone's home screen as a PWA / shortcut (Android).
    setLink("manifest", "/functions/storeManifest");

    return () => {
      cancelled = true;
    };
  }, [logo]);

  useEffect(() => {
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("application-name", name);
    setMeta("apple-mobile-web-app-title", name);
  }, [name]);

  return null;
}
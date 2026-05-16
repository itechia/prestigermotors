'use client';

import React from "react";
import { useStoreSettings } from "@/lib/useStoreSettings";

const ITEM_CLASS =
  "w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:scale-110 hover:shadow-sm transition-all overflow-hidden";

export default function SocialIcons({ className = "" }) {
  const s = useStoreSettings();

  const whatsappHref = s.whatsapp_number
    ? `https://wa.me/${String(s.whatsapp_number).replace(/\D/g, "")}`
    : "";

  const items = [
    { key: "instagram", url: s.instagram_url,  visible: s.social_show_instagram !== false, logo: s.social_logo_instagram,  label: "Instagram" },
    { key: "facebook",  url: s.facebook_url,   visible: s.social_show_facebook  !== false, logo: s.social_logo_facebook,   label: "Facebook"  },
    { key: "youtube",   url: s.youtube_url,    visible: s.social_show_youtube   !== false, logo: s.social_logo_youtube,    label: "YouTube"   },
    { key: "tiktok",    url: s.tiktok_url,     visible: s.social_show_tiktok    !== false, logo: s.social_logo_tiktok,     label: "TikTok"    },
    { key: "whatsapp",  url: whatsappHref,     visible: s.social_show_whatsapp  !== false, logo: s.social_logo_whatsapp,   label: "WhatsApp"  },
  ].filter((i) => i.visible && i.url && i.logo);

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-2.5 flex-wrap ${className}`}>
      {items.map(({ key, url, label, logo }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={ITEM_CLASS}
        >
          <img src={logo} alt={label} className="w-6 h-6 object-contain" />
        </a>
      ))}
    </div>
  );
}

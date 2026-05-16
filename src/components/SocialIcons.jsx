import React from "react";
import { useStoreSettings } from "@/lib/useStoreSettings";
import {
  InstagramLogo,
  FacebookLogo,
  YoutubeLogo,
  TiktokLogo,
  WhatsappLogo,
} from "@/components/SocialLogos";

const ITEM_CLASS =
  "w-9 h-9 rounded-xl overflow-hidden hover:scale-110 hover:shadow-md transition-all flex items-center justify-center";

export default function SocialIcons({ className = "" }) {
  const s = useStoreSettings();

  const whatsappHref = s.whatsapp_number
    ? `https://wa.me/${String(s.whatsapp_number).replace(/\D/g, "")}`
    : "";

  const items = [
    {
      key: "instagram",
      url: s.instagram_url,
      visible: s.social_show_instagram !== false,
      Icon: InstagramLogo,
      customLogo: s.social_logo_instagram,
      label: "Instagram",
    },
    {
      key: "facebook",
      url: s.facebook_url,
      visible: s.social_show_facebook !== false,
      Icon: FacebookLogo,
      customLogo: s.social_logo_facebook,
      label: "Facebook",
    },
    {
      key: "youtube",
      url: s.youtube_url,
      visible: s.social_show_youtube !== false,
      Icon: YoutubeLogo,
      customLogo: s.social_logo_youtube,
      label: "YouTube",
    },
    {
      key: "tiktok",
      url: s.tiktok_url,
      visible: s.social_show_tiktok !== false,
      Icon: TiktokLogo,
      customLogo: s.social_logo_tiktok,
      label: "TikTok",
    },
    {
      key: "whatsapp",
      url: whatsappHref,
      visible: s.social_show_whatsapp !== false,
      Icon: WhatsappLogo,
      customLogo: s.social_logo_whatsapp,
      label: "WhatsApp",
    },
  ].filter((i) => i.visible && i.url);

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-2.5 flex-wrap ${className}`}>
      {items.map(({ key, url, label, Icon, customLogo }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={ITEM_CLASS}
        >
          {customLogo ? (
            <img src={customLogo} alt={label} className="w-5 h-5 object-contain" />
          ) : (
            <Icon className="w-9 h-9" />
          )}
        </a>
      ))}
    </div>
  );
}
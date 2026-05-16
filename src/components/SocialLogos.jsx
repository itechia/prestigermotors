import React from "react";

export function InstagramLogo({ className = "w-9 h-9" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ig-rg" cx="28%" cy="108%" r="140%">
          <stop offset="0%" stopColor="#f9ed32" />
          <stop offset="18%" stopColor="#f9ed32" />
          <stop offset="40%" stopColor="#ee2a7b" />
          <stop offset="68%" stopColor="#7b3fb5" />
          <stop offset="100%" stopColor="#4460c3" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ig-rg)" />
      <rect x="12.5" y="12.5" width="23" height="23" rx="7" fill="none" stroke="#fff" strokeWidth="2.8" />
      <circle cx="24" cy="24" r="6" fill="none" stroke="#fff" strokeWidth="2.8" />
      <circle cx="34" cy="14" r="2" fill="#fff" />
    </svg>
  );
}

export function FacebookLogo({ className = "w-9 h-9" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#1877F2" />
      <path
        d="M28.5 24H25v13h-5V24h-2.5v-4.5H20v-2.8c0-3.5 1.6-5.7 5.8-5.7H29v4.5h-2.2c-1.3 0-1.8.6-1.8 1.8v2.2h4.1L28.5 24z"
        fill="#fff"
      />
    </svg>
  );
}

export function YoutubeLogo({ className = "w-9 h-9" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#fff" />
      <rect x="2" y="11" width="44" height="26" rx="9" fill="#FF0000" />
      <path d="M20 17l14 7-14 7V17z" fill="#fff" />
    </svg>
  );
}

export function TiktokLogo({ className = "w-9 h-9" }) {
  const shape = "M28 4.5h4A7.2 7.2 0 0 0 39.2 12v4a11.4 11.4 0 0 1-7.2-2.4v10A10 10 0 1 1 22 13.6c.4 0 .8 0 1.2.1v4.2a5.6 5.6 0 1 0 4.8 5.5V4.5z";
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#010101" />
      {/* cyan shadow top-left */}
      <path d={shape} fill="#25F4EE" transform="translate(-1.4,-1.4)" />
      {/* red shadow bottom-right */}
      <path d={shape} fill="#FE2C55" transform="translate(1.4,1.4)" />
      {/* white main shape on top */}
      <path d={shape} fill="#fff" />
    </svg>
  );
}

export function WhatsappLogo({ className = "w-9 h-9" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="11" fill="#25D366" />
      <path
        d="M24 8.5C15.4 8.5 8.5 15.4 8.5 24c0 3 .8 5.8 2.3 8.2l-2.3 7.3 7.5-2.3A15.4 15.4 0 0 0 24 39.5c8.6 0 15.5-6.9 15.5-15.5S32.6 8.5 24 8.5z"
        fill="#fff"
      />
      <path
        d="M31 27.2c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.4-1.3 1.7-.2.3-.5.3-.8.1-.4-.2-1.8-.7-3.4-2.1-1.2-1.1-2-2.5-2.3-2.9-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.2 0-.5-.1-.7-.1-.2-.9-2.2-1.3-3-.3-.8-.6-.7-.9-.7h-.7c-.3 0-.7.1-1 .5-.3.3-1.4 1.3-1.4 3.2s1.3 3.7 1.5 3.9c.2.3 2.7 4.1 6.5 5.7 3.8 1.6 3.8 1.1 4.5 1 .7-.1 2.2-.9 2.5-1.8.3-.8.3-1.5.2-1.7-.2-.1-.4-.2-.7-.3z"
        fill="#25D366"
      />
    </svg>
  );
}

export const SOCIAL_LOGOS = {
  instagram: InstagramLogo,
  facebook: FacebookLogo,
  youtube: YoutubeLogo,
  tiktok: TiktokLogo,
  whatsapp: WhatsappLogo,
};

import React from "react";

// Official-looking brand glyphs as inline SVG so they don't depend on external assets.
// Colors match each brand's primary identity.

export function InstagramLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#fdf497" />
          <stop offset="0.05" stopColor="#fdf497" />
          <stop offset="0.45" stopColor="#fd5949" />
          <stop offset="0.6" stopColor="#d6249f" />
          <stop offset="0.9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="#fff" />
    </svg>
  );
}

export function FacebookLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"
        fill="#1877F2"
      />
    </svg>
  );
}

export function YoutubeLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M23 7.5s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C16.7 4 12 4 12 4s-4.7 0-7.9.2c-.4.1-1.4.1-2.2 1C1.2 5.9 1 7.5 1 7.5S.8 9.4.8 11.3v1.4C.8 14.6 1 16.5 1 16.5s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.7.2 7.7.2s4.7 0 7.9-.2c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4c0-1.9-.2-3.8-.2-3.8z"
        fill="#FF0000"
      />
      <path d="M9.8 8.5v7l6.2-3.5-6.2-3.5z" fill="#fff" />
    </svg>
  );
}

export function TiktokLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M14.5 2h2.7a4.7 4.7 0 0 0 4.6 4.6v2.7a7.4 7.4 0 0 1-4.6-1.6v6.6a6.5 6.5 0 1 1-6.5-6.5c.3 0 .6 0 .9.1v2.8a3.7 3.7 0 1 0 2.9 3.6V2z"
        fill="#000"
      />
      <path
        d="M15.4 2.9h2.7a4.7 4.7 0 0 0 4.6 4.6v2.7a7.4 7.4 0 0 1-4.6-1.6v6.6a6.5 6.5 0 1 1-6.5-6.5c.3 0 .6 0 .9.1v2.8a3.7 3.7 0 1 0 2.9 3.6V2.9z"
        fill="#25F4EE"
        opacity="0.9"
      />
      <path
        d="M14.5 2h2.7a4.7 4.7 0 0 0 4.6 4.6v2.7a7.4 7.4 0 0 1-4.6-1.6v6.6a6.5 6.5 0 1 1-6.5-6.5c.3 0 .6 0 .9.1v2.8a3.7 3.7 0 1 0 2.9 3.6V2z"
        fill="#FE2C55"
        opacity="0.85"
      />
      <path
        d="M13.6 2.9h2.7a4.7 4.7 0 0 0 4.6 4.6v2.7a7.4 7.4 0 0 1-4.6-1.6v6.6a6.5 6.5 0 1 1-6.5-6.5c.3 0 .6 0 .9.1v2.8a3.7 3.7 0 1 0 2.9 3.6V2.9z"
        fill="#000"
      />
    </svg>
  );
}

export function WhatsappLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M20.5 3.5A10.4 10.4 0 0 0 3.6 16.3L2 22l5.8-1.5A10.4 10.4 0 1 0 20.5 3.5z"
        fill="#25D366"
      />
      <path
        d="M16.6 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5L8.7 7.4c-.2-.4-.3-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3 4.7 4.2 2.7 1.1 2.7.7 3.2.7s1.6-.7 1.8-1.3c.2-.6.2-1.1.2-1.3-.1-.1-.2-.2-.4-.2z"
        fill="#fff"
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
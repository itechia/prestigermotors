import React from "react";

export function InstagramLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ig-rg" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-rg)" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="3.2" fill="none" stroke="#fff" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="#fff" />
    </svg>
  );
}

export function FacebookLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M14.5 12h-2v6.5H10V12H8.5V9.5H10V8c0-1.7.8-2.8 2.8-2.8H15v2.5h-1.3c-.6 0-.8.3-.8.9v.9h2.2L14.5 12z"
        fill="#fff"
      />
    </svg>
  );
}

export function YoutubeLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M23 7.5s-.3-1.6-1-2.3c-.8-.9-1.8-.9-2.2-1C16.7 4 12 4 12 4s-4.7 0-7.8.2c-.4.1-1.4.1-2.2 1-.7.7-.9 2.3-.9 2.3S1 9.4 1 11.3v1.4c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.8.9 1.9.8 2.4 1 1.7.2 7.5.2 7.5.2s4.7 0 7.9-.3c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4C23 9.4 23 7.5 23 7.5z"
        fill="#FF0000"
      />
      <path d="M9.8 8.5v7l6.2-3.5-6.2-3.5z" fill="#fff" />
    </svg>
  );
}

export function TiktokLogo({ className = "w-5 h-5" }) {
  const d = "M14.5 2h2.7a4.7 4.7 0 0 0 4.6 4.6v2.7a7.4 7.4 0 0 1-4.6-1.6v6.6a6.5 6.5 0 1 1-6.5-6.5c.3 0 .6 0 .9.1v2.8a3.7 3.7 0 1 0 2.9 3.6V2z";
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={d} fill="#25F4EE" transform="translate(-0.6,-0.6)" />
      <path d={d} fill="#FE2C55" transform="translate(0.6,0.6)" />
      <path d={d} fill="#010101" />
    </svg>
  );
}

export function WhatsappLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        d="M17.5 6.5A7.5 7.5 0 0 0 4.7 14.8L3.5 19l4.3-1.1A7.5 7.5 0 1 0 17.5 6.5z"
        fill="#fff"
      />
      <path
        d="M15 13.6c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.4.1-.1.2-.5.7-.6.8-.1.1-.2.1-.4 0-.2-.1-.9-.3-1.7-1-.6-.6-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4l-.8-1.8c-.1-.3-.2-.3-.4-.3h-.3c-.1 0-.4 0-.6.2-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.1 1.6 2.4 3.8 3.4 2.2.9 2.2.6 2.6.6s1.3-.5 1.5-1c.2-.5.2-.9.1-1-.1-.1-.2-.2-.4-.3z"
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

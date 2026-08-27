import React from "react";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { usePublicSitePages } from "@/lib/usePublicSitePages";
import { getStoreNameFontStyle } from "@/lib/fonts";
import SocialIcons from "@/components/SocialIcons";

// Resolve o link de uma "página do site" no rodapé: páginas em Markdown vão
// para /pagina/[slug]; links diretos usam a própria URL configurada.
function resolveSitePageLink(page) {
  if (page.kind === "link") {
    const url = page.link_url || "#";
    if (page.link_type === "external" || /^https?:\/\//i.test(url)) {
      return { href: url, target: "_blank", rel: "noreferrer noopener" };
    }
    return { href: url.startsWith("/") ? url : `/${url}` };
  }
  return { href: `/pagina/${page.slug}` };
}

// Resolves a footer link based on its type:
// - "external": uses the URL exactly as provided (with target="_blank")
// - "domain" (default): treats the URL as a path on the current domain (relative link)
function resolveFooterLink(link) {
  const url = link?.url || "#";
  const isExternal =
    link?.link_type === "external" || /^https?:\/\//i.test(url);
  if (isExternal) {
    return { href: url, target: "_blank", rel: "noreferrer noopener" };
  }
  // Domain extension: ensure it starts with "/"
  const normalized = url.startsWith("/") || url === "#" ? url : `/${url}`;
  return { href: normalized };
}

function FooterColumn({ title, desc, links }) {
  if (!links || links.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
        {title}
      </h4>
      {desc && (
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{desc}</p>
      )}
      <ul className={`space-y-2.5 ${desc ? "" : "mt-4"}`}>
        {links.map((l, i) => {
          const props = resolveFooterLink(l);
          return (
            <li key={i}>
              <a
                {...props}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const s = useStoreSettings();
  const sitePages = usePublicSitePages();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-6 md:mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              {s.logo_url && (
                <img src={s.logo_url} alt={s.store_name} className="h-8 w-auto object-contain" width={32} height={32} />
              )}
              <span
                className="text-lg tracking-tight"
                style={getStoreNameFontStyle(s.store_name_font)}
              >
                {s.store_name}
              </span>
            </div>
            {s.footer_about && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {s.footer_about}
              </p>
            )}
            <SocialIcons className="justify-start" />
          </div>

          <FooterColumn
            title={s.footer_institutional_title || "Institucional"}
            desc={s.footer_institutional_desc}
            links={s.footer_institutional}
          />
          <FooterColumn
            title={s.footer_help_title || "Ajuda"}
            desc={s.footer_help_desc}
            links={s.footer_help}
          />
          <FooterColumn
            title={s.footer_payment_title || "Pagamento"}
            desc={s.footer_payment_desc}
            links={s.footer_payment}
          />
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center text-xs text-muted-foreground">
          <span>© {year} {s.store_name}. Todos os direitos reservados.</span>
          {sitePages.length > 0 && (
            <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-1">
              {sitePages.map((page) => (
                <a
                  key={page.id}
                  {...resolveSitePageLink(page)}
                  className="hover:text-foreground hover:underline transition-colors"
                >
                  {page.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
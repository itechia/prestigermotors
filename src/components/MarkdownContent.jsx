import React from "react";
import ReactMarkdown from "react-markdown";

// Renderiza Markdown livre (páginas legais criadas pelo admin: política de
// privacidade, termos de uso, LGPD...) com uma tipografia consistente com o
// resto do site, sem depender do plugin @tailwindcss/typography (não usado
// no projeto). Reutilizável tanto na página pública quanto na pré-visualização
// do admin.
const components = {
  h1: ({ children }) => (
    <h1 className="font-display font-bold text-2xl md:text-3xl mt-8 mb-4 first:mt-0 text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display font-bold text-xl md:text-2xl mt-8 mb-3 first:mt-0 text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display font-bold text-lg mt-6 mb-2 text-foreground">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm md:text-base leading-relaxed text-muted-foreground mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base text-muted-foreground mb-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 space-y-1.5 text-sm md:text-base text-muted-foreground mb-4">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target={/^https?:\/\//i.test(href || "") ? "_blank" : undefined}
      rel="noreferrer noopener"
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground mb-4">{children}</blockquote>
  ),
  hr: () => <hr className="border-border my-8" />,
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[0.85em] font-mono">{children}</code>
  ),
};

export default function MarkdownContent({ content, className = "" }) {
  if (!content?.trim()) {
    return <p className="text-sm text-muted-foreground italic">Nenhum conteúdo ainda.</p>;
  }
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

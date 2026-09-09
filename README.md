# Prestiger Motors

Catálogo de veículos em Next.js 14 (App Router) + Supabase, publicado na Vercel.

## Variáveis de ambiente

Crie um `.env.local` (e configure as mesmas variáveis na Vercel):

```
# Obrigatórias
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # apenas no servidor

# Recomendadas
NEXT_PUBLIC_SITE_URL=https://www.seudominio.com.br  # canonical, sitemap.xml e Open Graph
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX          # Google Analytics 4 (opcional)
```

- Sem `NEXT_PUBLIC_SITE_URL`, o site usa o domínio de produção da Vercel — defina a variável
  para que links compartilhados e o `sitemap.xml` apontem para o domínio próprio.
- Sem `NEXT_PUBLIC_GA_MEASUREMENT_ID`, nenhum script de analytics é carregado. Quando ela existe,
  o GA4 só grava cookies depois que o visitante aceita no aviso de cookies (Consent Mode).

## SEO e páginas institucionais

| Recurso | Onde fica |
| --- | --- |
| `robots.txt` | [app/robots.js](app/robots.js) |
| `sitemap.xml` | [app/sitemap.js](app/sitemap.js) — inclui cada veículo e as páginas do admin |
| Manifesto PWA | [app/manifest.js](app/manifest.js) |
| Favicon / ícone iOS | `app/icon.svg`, `app/apple-icon.png` |
| Imagem Open Graph padrão | `app/opengraph-image.png` (páginas de veículo usam a foto do carro) |
| Política de Privacidade | `/privacidade` — texto padrão em [src/lib/legalContent.js](src/lib/legalContent.js) |
| Termos de Uso | `/termos` — idem |
| Página de agradecimento | `/obrigado` |

As páginas legais usam o texto padrão do código, mas se o admin criar uma **Página do site** com o
slug `privacidade` ou `termos`, esse conteúdo passa a ser exibido no lugar.

Para regerar os PNGs de marca (ícones e imagem Open Graph):

```
npm run brand:images
```

---

## Analítico do site (painel do admin)

Em **Admin → Analítico** ficam as métricas de navegação do catálogo:

- visitantes, sessões, veículos visualizados e cliques em "Tenho interesse";
- funil de interesse — quantas sessões abriram um veículo, quantas chamaram a loja e
  quantas **saíram sem demonstrar interesse**;
- ranking dos veículos mais acessados, com tempo médio de leitura e taxa de conversão
  (veículo com muitas visitas e conversão zero aparece destacado em vermelho);
- termos buscados, filtros mais usados, páginas mais vistas, origem do acesso e dispositivos.

O período pode ser 7/30/90 dias, 12 meses ou **personalizado** (data inicial e final).

Como funciona:

| Peça | Onde |
| --- | --- |
| Coleta no navegador | [src/lib/analytics.js](src/lib/analytics.js) |
| Recebimento dos eventos | [app/api/track/route.js](app/api/track/route.js) |
| Consulta agregada | função `admin_analytics(dias)` no Postgres |
| Painel | [src/views/AdminAnalytics.jsx](src/views/AdminAnalytics.jsx) |

Os eventos **só são gravados quando o visitante aceita os cookies** no aviso de LGPD —
o próprio aviso explica que a medição é anônima. Nada que identifique a pessoa é
guardado: apenas um id de sessão e um id de visitante gerados aleatoriamente no
navegador. O histórico é limpo pela função `purge_old_site_events()` (400 dias).

O módulo `analitico` aparece nos bloqueios globais por módulo (Admin → Usuários) e é
restrito a administradores.

## Endereço dos veículos (slug)

Os links são `/veiculo/volkswagen-tera-1-4-tsi-highline-2023` em vez do UUID. A slug é
gerada no banco por gatilho quando o veículo é criado e **não muda** se marca ou modelo
forem editados depois — assim links já compartilhados no WhatsApp continuam válidos.
Para forçar uma nova slug, basta apagar o valor da coluna `slug` do veículo.

Links antigos (com UUID) são redirecionados com **308** para a URL com slug pelo
[middleware.js](middleware.js), preservando os parâmetros da URL.

---

**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)

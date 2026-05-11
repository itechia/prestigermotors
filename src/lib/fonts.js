// Fontes disponíveis para o nome da loja exibido no cabeçalho do site.
// Os valores `value` correspondem ao nome da família CSS (já carregada via Google Fonts em index.css ou injetada dinamicamente).

export const STORE_NAME_FONTS = [
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (padrão)", weight: 800 },
  { value: "Inter", label: "Inter", weight: 800 },
  { value: "Poppins", label: "Poppins", weight: 700 },
  { value: "Montserrat", label: "Montserrat", weight: 700 },
  { value: "Playfair Display", label: "Playfair Display (serifa elegante)", weight: 700 },
  { value: "Bebas Neue", label: "Bebas Neue (condensada)", weight: 400 },
  { value: "Pacifico", label: "Pacifico (manuscrita)", weight: 400 },
  { value: "Lobster", label: "Lobster (manuscrita)", weight: 400 },
  { value: "Oswald", label: "Oswald (alta e moderna)", weight: 700 },
  { value: "Anton", label: "Anton (impacto)", weight: 400 },
  { value: "Raleway", label: "Raleway", weight: 700 },
  { value: "Bricolage Grotesque", label: "Bricolage Grotesque", weight: 800 },
];

// CSS imports adicionais para as fontes que NÃO estão no index.css principal.
// É carregado uma única vez no app via <link>.
export const FONTS_GOOGLE_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Poppins:wght@400;600;700;800",
    "family=Montserrat:wght@400;600;700;800",
    "family=Playfair+Display:wght@400;600;700;800",
    "family=Bebas+Neue",
    "family=Pacifico",
    "family=Lobster",
    "family=Oswald:wght@400;600;700",
    "family=Anton",
    "family=Raleway:wght@400;600;700;800",
    "family=Bricolage+Grotesque:wght@400;600;700;800",
  ].join("&") +
  "&display=swap";

export function getStoreNameFontStyle(fontName) {
  const found = STORE_NAME_FONTS.find((f) => f.value === fontName);
  if (!found) return {};
  return {
    fontFamily: `'${found.value}', 'Plus Jakarta Sans', system-ui, sans-serif`,
    fontWeight: found.weight,
  };
}
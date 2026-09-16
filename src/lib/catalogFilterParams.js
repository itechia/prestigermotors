import { slugify } from "@/lib/useTaxonomies";

// Filtros do catálogo pela URL.
//
// Serve para abrir o site já filtrado a partir de um link: a notificação de
// uma promoção da linha XRE 300 leva direto para "/?tipo=Moto&modelo=XRE 300"
// em vez de largar o visitante na home para procurar sozinho.
//
// Os nomes dos parâmetros são em português para o link continuar legível no
// WhatsApp e na barra de endereços.

// Parâmetro na URL -> campo do filtro (todos aceitam vários valores separados
// por vírgula).
const LISTAS = {
  tipo: "vehicle_type",
  categoria: "body_type",
  modelo: "model",
  combustivel: "fuel_type",
  cambio: "transmission",
  condicao: "condition",
  cor: "color",
};

// Estes filtros comparam com o slug do valor do veículo, não com o texto puro
// (ver a filtragem em src/views/Catalog.jsx).
const COMPARA_POR_SLUG = new Set(["model", "color"]);

const NUMEROS = {
  precoMin: "priceMin",
  precoMax: "priceMax",
  anoMin: "yearMin",
  anoMax: "yearMax",
};

function listaDeValores(raw) {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/**
 * Lê os filtros de uma query string.
 * Devolve só o que veio no link: quem chama faz o merge com os filtros atuais.
 */
export function readCatalogParams(search) {
  const params = new URLSearchParams(search || "");
  const filters = {};

  for (const [param, campo] of Object.entries(LISTAS)) {
    if (!params.has(param)) continue;
    const valores = listaDeValores(params.get(param));
    if (valores.length === 0) continue;
    filters[campo] = COMPARA_POR_SLUG.has(campo) ? valores.map(slugify) : valores;
  }

  for (const [param, campo] of Object.entries(NUMEROS)) {
    if (!params.has(param)) continue;
    const numero = Number(String(params.get(param)).replace(/[^\d]/g, ""));
    if (Number.isFinite(numero) && numero > 0) filters[campo] = numero;
  }

  // A marca vai para as "pills" do topo (e não para filters.brand) para que o
  // link deixe a marca visivelmente selecionada na tela.
  const brands = params.has("marca") ? listaDeValores(params.get("marca")) : [];
  const termo = String(params.get("busca") || "").trim().slice(0, 80);

  return {
    filters,
    brands,
    search: termo,
    hasAny: Object.keys(filters).length > 0 || brands.length > 0 || Boolean(termo),
  };
}

/**
 * Monta o caminho do catálogo já filtrado, para o admin gerar o link.
 * Recebe os valores como o dono escreve ("Moto", "XRE 300").
 */
export function buildCatalogPath({ tipo, marca, modelo, busca } = {}) {
  const params = new URLSearchParams();
  if (tipo) params.set("tipo", tipo);
  if (marca) params.set("marca", marca);
  if (modelo) params.set("modelo", modelo);
  if (busca) params.set("busca", busca);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

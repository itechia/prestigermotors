// BRL formatting helpers — input em REAIS, não em centavos.
// Digitando "50000" → armazena 50000 → exibe "50.000,00"
// Digitando "50000,5" → armazena 50000.5 → exibe "50.000,50"
// Se não digitar centavos, considera ",00".

/** Formata número para exibição: "50000" → "R$ 50.000,00" */
export function formatBRL(value) {
  if (value === null || value === undefined || value === "" || isNaN(Number(value))) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

/**
 * Converte o que o usuário digitou em número.
 * Regras:
 *   - Remove "R$", espaços e pontos (separadores de milhar)
 *   - Vírgula = separador decimal
 *   - Se não houver vírgula, ,00 é assumido
 *   Exemplos:
 *     "50000"      → 50000
 *     "50.000"     → 50000
 *     "50.000,50"  → 50000.5
 *     "50000,5"    → 50000.5
 *     "50000,50"   → 50000.5
 */
export function parseBRLInput(input) {
  if (input === null || input === undefined || input === "") return 0;

  // Remove símbolo de moeda e espaços
  let s = String(input).replace(/R\$\s?/g, "").trim();

  // Separa na vírgula (decimal)
  const commaIdx = s.lastIndexOf(",");

  let reaisPart, centavosPart;
  if (commaIdx === -1) {
    // Sem vírgula — tudo são reais
    reaisPart = s;
    centavosPart = "00";
  } else {
    reaisPart = s.slice(0, commaIdx);
    centavosPart = s.slice(commaIdx + 1);
  }

  // Remove pontos de milhar dos reais
  const reaisDigits = reaisPart.replace(/\D/g, "");
  // Mantém só 2 dígitos dos centavos, completa com zeros à direita
  const centavosClean = centavosPart.replace(/\D/g, "").slice(0, 2).padEnd(2, "0");

  const reaisNum = reaisDigits ? Number(reaisDigits) : 0;
  const centavosNum = Number(centavosClean) / 100;

  return reaisNum + centavosNum;
}

/**
 * Formata um valor numérico para exibição dentro do <input> (sem prefixo R$).
 * Ex: 50000 → "50.000,00"
 */
export function maskBRLDisplay(value) {
  if (value === null || value === undefined || value === "" || isNaN(Number(value))) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

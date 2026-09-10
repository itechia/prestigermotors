// Mensagens de WhatsApp do veículo: a que o visitante manda para a loja
// ("tenho interesse") e a que ele manda para outra pessoa ("olha o que achei").
import { formatCurrency, formatMileage, formatYear } from "@/lib/formatters";
import { vehiclePath } from "@/lib/vehicleUrl";

// Transforma um valor cru de taxonomia ("automatico_powershift_3") em algo
// legível quando não temos a lista de rótulos do admin em mãos.
function humanize(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .split(/[_-]+/)
    .filter(Boolean)
    .map((parte) =>
      // Só ajusta o que veio todo em minúsculo; rótulos do admin como
      // "PowerShift" ficam como o lojista escreveu.
      parte === parte.toLowerCase() ? parte.charAt(0).toUpperCase() + parte.slice(1) : parte
    )
    .join(" ");
}

function resolveSpecs(vehicle, labels) {
  const usar = (resolver, valor) => {
    const rotulo = resolver ? resolver(valor) : "";
    return humanize(rotulo || valor);
  };

  return {
    fuel: usar(labels?.fuelLabel, vehicle.fuel_type),
    transmission: usar(labels?.transmissionLabel, vehicle.transmission),
    color: usar(labels?.colorLabel, vehicle.color),
  };
}

// URL pública do veículo.
//
// IMPORTANTE: é montada do zero, nunca a partir de window.location. A página
// pode estar aberta com ?nome=&tel= de um atendimento em andamento, e esses
// dados não podem viajar no link que o visitante compartilha com terceiros.
//
// `source` marca a origem da visita para o analítico (o navegador embutido do
// WhatsApp não envia referrer).
export function buildVehicleUrl(vehicle, { source } = {}) {
  if (typeof window === "undefined" || !vehicle) return "";
  const path = vehiclePath(vehicle);
  if (path === "/") return "";

  const url = `${window.location.origin}${path}`;
  return source ? `${url}?ref=${encodeURIComponent(source)}` : url;
}

// Visitante -> loja. Vai para o wa.me da loja, então o link fica limpo.
export function buildVehicleWhatsAppMessage(vehicle, { labels } = {}) {
  if (!vehicle) return "";

  const url = buildVehicleUrl(vehicle);
  const nome = [vehicle.brand, vehicle.model, vehicle.version]
    .filter(Boolean)
    .join(" ")
    .trim();
  const ano = formatYear(vehicle.manufacture_year, vehicle.year);
  const specs = resolveSpecs(vehicle, labels);

  const linhas = ["Olá! Tenho interesse neste veículo:", ""];

  linhas.push(`*${nome}*`);
  if (ano) linhas.push(`📅 Ano: ${ano}`);
  if (vehicle.mileage) linhas.push(`🛣️ KM: ${formatMileage(vehicle.mileage)}`);
  if (specs.fuel) linhas.push(`⛽ Combustível: ${specs.fuel}`);
  if (specs.transmission) linhas.push(`⚙️ Câmbio: ${specs.transmission}`);
  if (specs.color) linhas.push(`🎨 Cor: ${specs.color}`);
  if (vehicle.price) linhas.push(`💰 Preço: ${formatCurrency(vehicle.price)}`);

  if (url) {
    linhas.push("");
    linhas.push(url);
  }

  linhas.push("");
  linhas.push("Pode me passar mais informações?");

  return linhas.join("\n");
}

// Visitante -> outra pessoa. Blocos curtos separados por linha em branco:
// no WhatsApp isso vira parágrafo, e o link sozinho na última linha garante
// que o app monte o card de pré-visualização com a foto do veículo.
export function buildVehicleShareText(vehicle, settings = {}, { includeUrl = false, labels } = {}) {
  if (!vehicle) return "";

  const loja = settings.store_name || "loja";
  const nome = [vehicle.brand, vehicle.model, vehicle.version]
    .filter(Boolean)
    .join(" ")
    .trim();
  const ano = formatYear(vehicle.manufacture_year, vehicle.year);
  const km = vehicle.mileage ? formatMileage(vehicle.mileage) : "";
  const specs = resolveSpecs(vehicle, labels);

  const linhas = [`Olha o que eu encontrei no site da *${loja}*:`, ""];

  // Bloco 1 — identificação
  linhas.push(`🚗 *${nome}*`);
  const identificacao = [ano, km].filter(Boolean).join(" • ");
  if (identificacao) linhas.push(identificacao);

  // Bloco 2 — ficha rápida
  const ficha = [];
  if (specs.fuel) ficha.push(`⛽ ${specs.fuel}`);
  if (specs.transmission) ficha.push(`⚙️ ${specs.transmission}`);
  if (specs.color) ficha.push(`🎨 ${specs.color}`);
  if (ficha.length) {
    linhas.push("");
    linhas.push(...ficha);
  }

  // Bloco 3 — preço
  if (vehicle.price) {
    linhas.push("");
    const temDesconto = vehicle.price_old && vehicle.price_old > vehicle.price;
    if (temDesconto) linhas.push(`~${formatCurrency(vehicle.price_old)}~`);
    linhas.push(`💰 *${formatCurrency(vehicle.price)}*`);
  }

  // Bloco 4 — link
  if (includeUrl) {
    const url = buildVehicleUrl(vehicle, { source: "whatsapp" });
    if (url) {
      linhas.push("");
      linhas.push("Fotos e ficha completa:");
      linhas.push(url);
    }
  }

  return linhas.join("\n");
}

// URL https://wa.me/... pronta para abrir.
export function buildWhatsAppHref(whatsappNumber, vehicle, options = {}) {
  const numero = String(whatsappNumber || "").replace(/\D/g, "");
  const texto = encodeURIComponent(buildVehicleWhatsAppMessage(vehicle, options));
  return `https://wa.me/${numero}?text=${texto}`;
}
